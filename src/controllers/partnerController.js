const User = require('../models/user');
const PersonalityTest = require('../models/personalityTest');
const UpskillingProgress = require('../models/upskillingProgress');
const VarkTest = require('../models/varkTest');

/**
 * GET /partner/users
 * Returns a lightweight list of all users for the partner dashboard.
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select(
        'firstName lastName email phone profilePhoto createdAt certificateSentCount domaine speciality'
      )
      .sort({ createdAt: -1 })
      .lean();

    // For each user, also grab personality + challenge progress summary
    const userIds = users.map((u) => u._id);

    const [personalityTests, upskillingProgresses, varkTests] = await Promise.all([
      PersonalityTest.find({ userId: { $in: userIds } })
        .select('userId dominantColor completed')
        .lean(),
      UpskillingProgress.find({ userId: { $in: userIds } })
        .select('userId challenges personalityColor')
        .lean(),
      VarkTest.find({ userId: { $in: userIds } })
        .select('userId dominantStyle completed styleCounts')
        .lean(),
    ]);

    const personalityMap = {};
    personalityTests.forEach((p) => {
      personalityMap[p.userId.toString()] = p;
    });

    const upskillingMap = {};
    upskillingProgresses.forEach((u) => {
      upskillingMap[u.userId.toString()] = u;
    });

    const varkMap = {};
    varkTests.forEach((v) => {
      varkMap[v.userId.toString()] = v;
    });

    const result = users.map((user) => {
      const uid = user._id.toString();
      const personality = personalityMap[uid];
      const upskilling = upskillingMap[uid];
      const vark = varkMap[uid];

      const completedChallenges = upskilling
        ? upskilling.challenges.filter((c) => c.completed).length
        : 0;

      return {
        id: uid,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || null,
        profilePhoto: user.profilePhoto || null,
        joinDate: user.createdAt,
        certificates: user.certificateSentCount || 0,
        domaine: user.domaine,
        speciality: user.speciality,
        personality: personality
          ? {
              dominantColor: personality.dominantColor,
              completed: personality.completed,
            }
          : null,
        challenges: {
          completed: completedChallenges,
          total: 21,
          personalityColor: upskilling ? upskilling.personalityColor : null,
          initialized: !!upskilling,
        },
        vark: vark
          ? {
              dominantStyle: vark.dominantStyle,
              completed: vark.completed,
              styleCounts: vark.styleCounts,
            }
          : null,
      };
    });

    return res.json({ users: result, total: result.length });
  } catch (error) {
    console.error('Partner: Error fetching users:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /partner/users/:id
 * Returns full user details + personality test result.
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password -refreshToken -resetPasswordToken -deletionToken')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const personalityTest = await PersonalityTest.findOne({ userId: id }).lean();

    return res.json({
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || null,
        profilePhoto: user.profilePhoto || null,
        joinDate: user.createdAt,
        updatedAt: user.updatedAt,
        certificates: user.certificateSentCount || 0,
        certificateReference: user.certificateReference || null,
        domaine: user.domaine,
        speciality: user.speciality,
        socialAuth: {
          google: !!user.socialAuth?.googleId,
          facebook: !!user.socialAuth?.facebookId,
          linkedin: !!user.socialAuth?.linkedinId,
          apple: !!user.socialAuth?.appleId,
        },
        hasPassword: !!user.password,
      },
      personalityTest: personalityTest
        ? {
            completed: personalityTest.completed,
            dominantColor: personalityTest.dominantColor,
            colorCounts: personalityTest.colorCounts,
            completedAt: personalityTest.completedAt,
            answers: personalityTest.answers,
          }
        : null,
    });
  } catch (error) {
    console.error('Partner: Error fetching user by id:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /partner/users/:id/challenges
 * Returns 21-day challenge progress for a specific user.
 */
const getUserChallenges = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('firstName lastName email profilePhoto').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const upskillingProgress = await UpskillingProgress.findOne({ userId: id }).lean();

    if (!upskillingProgress) {
      return res.json({
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profilePhoto: user.profilePhoto || null,
        },
        initialized: false,
        challenges: [],
        summary: {
          completed: 0,
          total: 21,
          percentage: 0,
          personalityColor: null,
          currentStreak: 0,
          startedAt: null,
          completedAt: null,
        },
      });
    }

    // Build all 21 days with status
    const challengeMap = {};
    upskillingProgress.challenges.forEach((c) => {
      challengeMap[c.day] = c;
    });

    const allChallenges = [];
    for (let day = 1; day <= 21; day++) {
      const c = challengeMap[day];
      allChallenges.push({
        day,
        completed: c ? c.completed : false,
        completedAt: c ? c.completedAt || null : null,
        notes: c ? c.notes || '' : '',
        submission: c && c.submission ? c.submission : null,
      });
    }

    const completedCount = allChallenges.filter((c) => c.completed).length;

    return res.json({
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePhoto: user.profilePhoto || null,
      },
      initialized: true,
      challenges: allChallenges,
      summary: {
        completed: completedCount,
        total: 21,
        percentage: Math.round((completedCount / 21) * 100),
        personalityColor: upskillingProgress.personalityColor,
        currentStreak: upskillingProgress.currentStreak || 0,
        startedAt: upskillingProgress.startedAt || null,
        completedAt: upskillingProgress.completedAt || null,
      },
    });
  } catch (error) {
    console.error('Partner: Error fetching user challenges:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getUsers,
  getUserById,
  getUserChallenges,
};
