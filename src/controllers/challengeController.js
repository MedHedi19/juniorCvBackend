const UpskillingProgress = require('../models/upskillingProgress');
const fs = require('fs');
const path = require('path');

// Helper functions for daily challenge locking logic
function getChallengeLockStatus(upskillingProgress) {
  const completedChallenges = (upskillingProgress.challenges || []).filter((c) => c.completed);
  let maxCompletedDay = 0;
  let hasCompletedChallengeToday = false;

  if (completedChallenges.length > 0) {
    const latestChallenge = completedChallenges.reduce((prev, current) => 
      (prev.day > current.day) ? prev : current
    );
    maxCompletedDay = latestChallenge.day;
    
    if (latestChallenge.completedAt) {
      const lastCompletionDate = new Date(latestChallenge.completedAt);
      const today = new Date();
      
      // Compare calendar dates
      if (
        lastCompletionDate.getFullYear() === today.getFullYear() &&
        lastCompletionDate.getMonth() === today.getMonth() &&
        lastCompletionDate.getDate() === today.getDate()
      ) {
        hasCompletedChallengeToday = true;
      }
    }
  }

  const nextAllowedDay = maxCompletedDay + 1;
  return { nextAllowedDay, hasCompletedChallengeToday };
}

function calculateIsLocked(day, completed, nextAllowedDay, hasCompletedChallengeToday) {
  if (completed) return false;
  // Rule 1: We must do challenges in order
  if (day > nextAllowedDay) return true;
  // Rule 2: We can only do one challenge per day
  if (day === nextAllowedDay && hasCompletedChallengeToday) return true;
  
  return false;
}

function isDayLocked(dayNumber, upskillingProgress) {
  const { nextAllowedDay, hasCompletedChallengeToday } = getChallengeLockStatus(upskillingProgress);
  const userChallenge = upskillingProgress.challenges.find((c) => c.day === dayNumber);
  const completed = userChallenge ? userChallenge.completed : false;
  
  return calculateIsLocked(dayNumber, completed, nextAllowedDay, hasCompletedChallengeToday);
}

// Load challenge data from JSON files
const loadChallengeData = (color) => {
  const colorFiles = {
    rouge: 'Red.json',
    jaune: 'Yellow.json',
    vert: 'Green.json',
    bleu: 'Blue.jsonc',
  };

  const fileName = colorFiles[color.toLowerCase()];
  if (!fileName) {
    throw new Error(`Invalid color: ${color}`);
  }

  const filePath = path.join(__dirname, '../data/upskilling', fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Challenge file not found for color: ${color}`);
  }

  const rawData = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(rawData);
};

// Initialize user challenges based on personality color
exports.initializeChallenges = async (req, res) => {
  try {
    const { personalityColor } = req.body;
    const userId = req.user.id;

    // Validate color
    const validColors = ['rouge', 'jaune', 'vert', 'bleu'];
    if (!validColors.includes(personalityColor.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid personality color. Must be: rouge, jaune, vert, or bleu',
      });
    }

    // Find or create upskilling progress
    let upskillingProgress = await UpskillingProgress.findOne({ userId });

    if (upskillingProgress) {
      // ⚠️ IMPORTANT: Don't reset existing progress!
      // Only update personality color if it changed
      if (upskillingProgress.personalityColor !== personalityColor.toLowerCase()) {
        console.log(
          `⚠️ User ${userId} changing personality color from ${upskillingProgress.personalityColor} to ${personalityColor}`
        );
        upskillingProgress.personalityColor = personalityColor.toLowerCase();
        // Keep existing challenge progress, don't reset it!
      }

      // Return existing progress without changes
      return res.status(200).json({
        success: true,
        message: 'Challenges already initialized',
        data: {
          personalityColor: upskillingProgress.personalityColor,
          totalChallenges: 21,
          completedChallenges: upskillingProgress.challenges.filter((c) => c.completed).length,
          startedAt: upskillingProgress.startedAt,
        },
      });
    } else {
      // Create new progress ONLY if doesn't exist
      upskillingProgress = new UpskillingProgress({
        userId,
        personalityColor: personalityColor.toLowerCase(),
        challenges: Array.from({ length: 21 }, (_, i) => ({
          day: i + 1,
          completed: false,
          notes: '',
        })),
        startedAt: new Date(),
        lastAccessedDay: 1,
      });
    }

    await upskillingProgress.save();

    res.status(200).json({
      success: true,
      message: 'Challenges initialized successfully',
      data: {
        personalityColor: upskillingProgress.personalityColor,
        totalChallenges: 21,
        completedChallenges: 0,
        startedAt: upskillingProgress.startedAt,
      },
    });
  } catch (error) {
    console.error('Initialize challenges error:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing challenges',
      error: error.message,
    });
  }
};

// Get all challenges for user's personality color
exports.getAllChallenges = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lang = 'fr' } = req.query;

    const upskillingProgress = await UpskillingProgress.findOne({ userId });

    if (!upskillingProgress) {
      return res.status(404).json({
        success: false,
        message: 'No challenges initialized. Please complete personality test first.',
      });
    }

    const color = upskillingProgress.personalityColor;
    const challengeData = loadChallengeData(color);

    const { nextAllowedDay, hasCompletedChallengeToday } = getChallengeLockStatus(upskillingProgress);

    // Merge challenge data with user progress
    const challenges = challengeData.challenges.map((challenge, index) => {
      const userChallengeProgress = upskillingProgress.challenges.find(
        (c) => c.day === challenge.day
      ) || { completed: false, notes: '', day: challenge.day };

      const isLocked = calculateIsLocked(
        challenge.day,
        userChallengeProgress.completed,
        nextAllowedDay,
        hasCompletedChallengeToday
      );

      return {
        day: challenge.day,
        intro: challenge.intro ? challenge.intro[lang] || challenge.intro.fr : undefined,
        proverb: challenge.proverb[lang] || challenge.proverb.fr,
        challenge: challenge.challenge[lang] || challenge.challenge.fr,
        type: challenge.type,
        completed: userChallengeProgress.completed,
        completedAt: userChallengeProgress.completedAt,
        notes: userChallengeProgress.notes,
        locked: isLocked,
      };
    });
    res.status(200).json({
      success: true,
      data: {
        personalityColor: color,
        totalChallenges: 21,
        completedChallenges: upskillingProgress.challenges.filter((c) => c.completed).length,
        challenges: challenges,
      },
    });
  } catch (error) {
    console.error('Get all challenges error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching challenges',
      error: error.message,
    });
  }
};

// Get a specific challenge by day
exports.getChallengeByDay = async (req, res) => {
  try {
    const userId = req.user.id;
    const { day } = req.params;
    const { lang = 'fr' } = req.query;

    const dayNumber = parseInt(day);
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 21) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day. Must be between 1 and 21',
      });
    }

    const userProgress = await UpskillingProgress.findOne({ userId });

    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No challenges initialized. Please complete personality test first.',
      });
    }

    const color = userProgress.personalityColor;
    const challengeData = loadChallengeData(color);

    const challenge = challengeData.challenges.find((c) => c.day === dayNumber);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: `Challenge for day ${dayNumber} not found`,
      });
    }

    const userChallengeProgress = userProgress.challenges.find((c) => c.day === dayNumber) || {
      completed: false,
      notes: '',
      day: dayNumber,
    };

    const locked = isDayLocked(dayNumber, userProgress);

    // Update last accessed day
    userProgress.lastAccessedDay = dayNumber;
    await userProgress.save();

    res.status(200).json({
      success: true,
      data: {
        day: challenge.day,
        intro: challenge.intro ? challenge.intro[lang] || challenge.intro.fr : undefined,
        proverb: challenge.proverb[lang] || challenge.proverb.fr,
        challenge: challenge.challenge[lang] || challenge.challenge.fr,
        type: challenge.type,
        completed: userChallengeProgress.completed,
        completedAt: userChallengeProgress.completedAt,
        notes: userChallengeProgress.notes,
        locked: locked,
      },
    });  } catch (error) {
    console.error('Get challenge by day error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching challenge',
      error: error.message,
    });
  }
};

// Mark a challenge as completed
exports.completeChallenge = async (req, res) => {
  try {
    const userId = req.user.id;
    const { day } = req.params;
    const { notes = '' } = req.body;

    const dayNumber = parseInt(day);
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 21) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day. Must be between 1 and 21',
      });
    }

    const userProgress = await UpskillingProgress.findOne({ userId });

    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No challenges initialized',
      });
    }

    if (isDayLocked(dayNumber, userProgress)) {
      return res.status(403).json({
        success: false,
        message: 'This challenge is locked. You can only complete one set per day, in order.',
      });
    }

    // Find the challenge in user's progress
    let challengeIndex = userProgress.challenges.findIndex((c) => c.day === dayNumber);

    if (challengeIndex === -1) {
      // If challenge doesn't exist, create it
      userProgress.challenges.push({
        day: dayNumber,
        completed: true,
        completedAt: new Date(),
        notes: notes,
      });
    } else {
      // Update existing challenge
      userProgress.challenges[challengeIndex].completed = true;
      userProgress.challenges[challengeIndex].completedAt = new Date();
      userProgress.challenges[challengeIndex].notes = notes;
    }

    await userProgress.save();

    const completedCount = userProgress.challenges.filter((c) => c.completed).length;

    res.status(200).json({
      success: true,
      message: 'Challenge completed successfully',
      data: {
        day: dayNumber,
        completedChallenges: completedCount,
        totalChallenges: 21,
        allCompleted: completedCount === 21,
      },
    });
  } catch (error) {
    console.error('Complete challenge error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing challenge',
      error: error.message,
    });
  }
};

// Get user's challenge progress summary
exports.getChallengeProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const userProgress = await UpskillingProgress.findOne({ userId });

    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No challenges initialized',
      });
    }

    const completedChallenges = userProgress.challenges.filter((c) => c.completed).length;
    const currentStreak = calculateStreak(userProgress.challenges);
    
    // Check if the next challenge is locked
    const { nextAllowedDay, hasCompletedChallengeToday } = getChallengeLockStatus(userProgress);
    const nextChallengeLocked = calculateIsLocked(nextAllowedDay, false, nextAllowedDay, hasCompletedChallengeToday);

    res.status(200).json({
      success: true,
      data: {
        personalityColor: userProgress.personalityColor,
        totalChallenges: 21,
        completedChallenges: completedChallenges,
        remainingChallenges: 21 - completedChallenges,
        progressPercentage: Math.round((completedChallenges / 21) * 100),
        currentStreak: currentStreak,
        lastAccessedDay: userProgress.lastAccessedDay,
        startedAt: userProgress.startedAt,
        allCompleted: completedChallenges === 21,
        nextAllowedDay: nextAllowedDay,
        nextChallengeLocked: nextChallengeLocked,
      },
    });
  } catch (error) {
    console.error('Get challenge progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching progress',
      error: error.message,
    });
  }
};

// Helper function to calculate current streak
function calculateStreak(challenges) {
  if (!challenges || challenges.length === 0) return 0;

  const sortedChallenges = [...challenges].filter((c) => c.completed).sort((a, b) => a.day - b.day);

  if (sortedChallenges.length === 0) return 0;

  let streak = 1;
  for (let i = sortedChallenges.length - 1; i > 0; i--) {
    if (sortedChallenges[i].day - sortedChallenges[i - 1].day === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Submit text for a challenge
exports.submitText = async (req, res) => {
  try {
    const userId = req.user.id;
    const { day } = req.params;
    const { textContent } = req.body;

    const dayNumber = parseInt(day);
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 21) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day. Must be between 1 and 21',
      });
    }

    if (!textContent || textContent.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Text content is required',
      });
    }

    const userProgress = await UpskillingProgress.findOne({ userId });

    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No challenges initialized',
      });
    }

    if (isDayLocked(dayNumber, userProgress)) {
      return res.status(403).json({
        success: false,
        message: 'This challenge is locked. You can only submit items 1 challenge per day, in order.',
      });
    }

    // Find or create the challenge
    let challengeIndex = userProgress.challenges.findIndex((c) => c.day === dayNumber);

    if (challengeIndex === -1) {
      userProgress.challenges.push({
        day: dayNumber,
        completed: false,
        submission: {
          type: 'text',
          textContent: textContent,
          uploadedAt: new Date(),
        },
      });
    } else {
      if (!userProgress.challenges[challengeIndex].submission) {
        userProgress.challenges[challengeIndex].submission = {};
      }
      userProgress.challenges[challengeIndex].submission.type = 'text';
      userProgress.challenges[challengeIndex].submission.textContent = textContent;
      userProgress.challenges[challengeIndex].submission.uploadedAt = new Date();
    }

    await userProgress.save();

    res.status(200).json({
      success: true,
      message: 'Text submitted successfully',
      data: {
        day: dayNumber,
        submissionType: 'text',
      },
    });
  } catch (error) {
    console.error('Submit text error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting text',
      error: error.message,
    });
  }
};

// Submit media URL for a challenge (audio/video)
exports.submitMedia = async (req, res) => {
  try {
    const userId = req.user.id;
    const { day } = req.params;
    const { mediaUrl, mediaType, submissionType } = req.body;

    const dayNumber = parseInt(day);
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 21) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day. Must be between 1 and 21',
      });
    }

    if (!mediaUrl || !submissionType) {
      return res.status(400).json({
        success: false,
        message: 'Media URL and submission type are required',
      });
    }

    if (!['audio', 'video'].includes(submissionType)) {
      return res.status(400).json({
        success: false,
        message: 'Submission type must be audio or video',
      });
    }

    const userProgress = await UpskillingProgress.findOne({ userId });

    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No challenges initialized',
      });
    }

    if (isDayLocked(dayNumber, userProgress)) {
      return res.status(403).json({
        success: false,
        message: 'This challenge is locked. You can only submit items 1 challenge per day, in order.',
      });
    }

    // Find or create the challenge
    let challengeIndex = userProgress.challenges.findIndex((c) => c.day === dayNumber);

    if (challengeIndex === -1) {
      userProgress.challenges.push({
        day: dayNumber,
        completed: false,
        submission: {
          type: submissionType,
          mediaUrl: mediaUrl,
          mediaType: mediaType,
          uploadedAt: new Date(),
        },
      });
    } else {
      if (!userProgress.challenges[challengeIndex].submission) {
        userProgress.challenges[challengeIndex].submission = {};
      }
      userProgress.challenges[challengeIndex].submission.type = submissionType;
      userProgress.challenges[challengeIndex].submission.mediaUrl = mediaUrl;
      userProgress.challenges[challengeIndex].submission.mediaType = mediaType;
      userProgress.challenges[challengeIndex].submission.uploadedAt = new Date();
    }

    await userProgress.save();

    res.status(200).json({
      success: true,
      message: `${submissionType.charAt(0).toUpperCase() + submissionType.slice(1)} submitted successfully`,
      data: {
        day: dayNumber,
        submissionType: submissionType,
        mediaUrl: mediaUrl,
      },
    });
  } catch (error) {
    console.error('Submit media error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting media',
      error: error.message,
    });
  }
};

// Get submission for a specific challenge day
exports.getSubmission = async (req, res) => {
  try {
    const userId = req.user.id;
    const { day } = req.params;

    const dayNumber = parseInt(day);
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 21) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day. Must be between 1 and 21',
      });
    }

    const userProgress = await UpskillingProgress.findOne({ userId });

    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No challenges initialized',
      });
    }

    const challenge = userProgress.challenges.find((c) => c.day === dayNumber);

    if (!challenge || !challenge.submission || challenge.submission.type === 'none') {
      return res.status(404).json({
        success: false,
        message: 'No submission found for this challenge',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        day: dayNumber,
        submission: challenge.submission,
      },
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submission',
      error: error.message,
    });
  }
};

// Get Cloudinary configuration for mobile app
exports.getCloudinaryConfig = async (req, res) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    const hasMissingConfig = !cloudName || !uploadPreset;
    const hasPlaceholderConfig =
      cloudName === 'your_cloud_name' || uploadPreset === 'your_unsigned_preset';

    if (hasMissingConfig || hasPlaceholderConfig) {
      return res.status(500).json({
        success: false,
        message:
          'Cloudinary is not configured on server. Please set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET.',
      });
    }

    // We only return public configuration needed for unsigned uploads
    // DO NOT return the API SECRET here!
    res.status(200).json({
      success: true,
      data: {
        cloudName,
        uploadPreset,
      },
    });
  } catch (error) {
    console.error('Get Cloudinary config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching configuration',
      error: error.message,
    });
  }
};

module.exports = exports;
