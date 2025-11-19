const UpskillingProgress = require('../models/upskillingProgress');
const fs = require('fs');
const path = require('path');

// Load challenge data from JSON files
const loadChallengeData = (color) => {
    const colorFiles = {
        'rouge': 'Red.json',
        'jaune': 'Yellow.json',
        'vert': 'Green.json',
        'bleu': 'Blue.jsonc'
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
                message: 'Invalid personality color. Must be: rouge, jaune, vert, or bleu'
            });
        }

        // Find or create upskilling progress
        let upskillingProgress = await UpskillingProgress.findOne({ userId });
        
        if (upskillingProgress) {
            // If already exists, update it
            upskillingProgress.personalityColor = personalityColor.toLowerCase();
            upskillingProgress.challenges = Array.from({ length: 21 }, (_, i) => ({
                day: i + 1,
                completed: false,
                notes: ''
            }));
            upskillingProgress.startedAt = new Date();
            upskillingProgress.lastAccessedDay = 1;
        } else {
            // Create new progress
            upskillingProgress = new UpskillingProgress({
                userId,
                personalityColor: personalityColor.toLowerCase(),
                challenges: Array.from({ length: 21 }, (_, i) => ({
                    day: i + 1,
                    completed: false,
                    notes: ''
                })),
                startedAt: new Date(),
                lastAccessedDay: 1
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
                startedAt: upskillingProgress.startedAt
            }
        });
    } catch (error) {
        console.error('Initialize challenges error:', error);
        res.status(500).json({
            success: false,
            message: 'Error initializing challenges',
            error: error.message
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
                message: 'No challenges initialized. Please complete personality test first.'
            });
        }

        const color = upskillingProgress.personalityColor;
        const challengeData = loadChallengeData(color);

        // Merge challenge data with user progress
        const challenges = challengeData.challenges.map((challenge, index) => {
            const userChallengeProgress = upskillingProgress.challenges.find(
                c => c.day === challenge.day
            ) || { completed: false, notes: '', day: challenge.day };

            return {
                day: challenge.day,
                intro: challenge.intro ? (challenge.intro[lang] || challenge.intro.fr) : undefined,
                proverb: challenge.proverb[lang] || challenge.proverb.fr,
                challenge: challenge.challenge[lang] || challenge.challenge.fr,
                type: challenge.type,
                completed: userChallengeProgress.completed,
                completedAt: userChallengeProgress.completedAt,
                notes: userChallengeProgress.notes
            };
        });

        res.status(200).json({
            success: true,
            data: {
                personalityColor: color,
                totalChallenges: 21,
                completedChallenges: upskillingProgress.challenges.filter(c => c.completed).length,
                challenges: challenges
            }
        });
    } catch (error) {
        console.error('Get all challenges error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching challenges',
            error: error.message
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
                message: 'Invalid day. Must be between 1 and 21'
            });
        }

        const userProgress = await UpskillingProgress.findOne({ userId });
        
        if (!userProgress) {
            return res.status(404).json({
                success: false,
                message: 'No challenges initialized. Please complete personality test first.'
            });
        }

        const color = userProgress.personalityColor;
        const challengeData = loadChallengeData(color);

        const challenge = challengeData.challenges.find(c => c.day === dayNumber);
        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: `Challenge for day ${dayNumber} not found`
            });
        }

        const userChallengeProgress = userProgress.challenges.find(
            c => c.day === dayNumber
        ) || { completed: false, notes: '', day: dayNumber };

        // Update last accessed day
        userProgress.lastAccessedDay = dayNumber;
        await userProgress.save();

        res.status(200).json({
            success: true,
            data: {
                day: challenge.day,
                intro: challenge.intro ? (challenge.intro[lang] || challenge.intro.fr) : undefined,
                proverb: challenge.proverb[lang] || challenge.proverb.fr,
                challenge: challenge.challenge[lang] || challenge.challenge.fr,
                type: challenge.type,
                completed: userChallengeProgress.completed,
                completedAt: userChallengeProgress.completedAt,
                notes: userChallengeProgress.notes
            }
        });
    } catch (error) {
        console.error('Get challenge by day error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching challenge',
            error: error.message
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
                message: 'Invalid day. Must be between 1 and 21'
            });
        }

        const userProgress = await UpskillingProgress.findOne({ userId });
        
        if (!userProgress) {
            return res.status(404).json({
                success: false,
                message: 'No challenges initialized'
            });
        }

        // Find the challenge in user's progress
        let challengeIndex = userProgress.challenges.findIndex(
            c => c.day === dayNumber
        );

        if (challengeIndex === -1) {
            // If challenge doesn't exist, create it
            userProgress.challenges.push({
                day: dayNumber,
                completed: true,
                completedAt: new Date(),
                notes: notes
            });
        } else {
            // Update existing challenge
            userProgress.challenges[challengeIndex].completed = true;
            userProgress.challenges[challengeIndex].completedAt = new Date();
            userProgress.challenges[challengeIndex].notes = notes;
        }

        await userProgress.save();

        const completedCount = userProgress.challenges.filter(c => c.completed).length;

        res.status(200).json({
            success: true,
            message: 'Challenge completed successfully',
            data: {
                day: dayNumber,
                completedChallenges: completedCount,
                totalChallenges: 21,
                allCompleted: completedCount === 21
            }
        });
    } catch (error) {
        console.error('Complete challenge error:', error);
        res.status(500).json({
            success: false,
            message: 'Error completing challenge',
            error: error.message
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
                message: 'No challenges initialized'
            });
        }

        const completedChallenges = userProgress.challenges.filter(c => c.completed).length;
        const currentStreak = calculateStreak(userProgress.challenges);

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
                allCompleted: completedChallenges === 21
            }
        });
    } catch (error) {
        console.error('Get challenge progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching progress',
            error: error.message
        });
    }
};

// Helper function to calculate current streak
function calculateStreak(challenges) {
    if (!challenges || challenges.length === 0) return 0;

    const sortedChallenges = [...challenges]
        .filter(c => c.completed)
        .sort((a, b) => a.day - b.day);

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

module.exports = exports;
