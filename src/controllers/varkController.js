const VarkTest = require('../models/varkTest');
const varkData = require('../data/vark/vark.json');

const TOTAL_DAYS = 21;

const getLanguage = (req) => {
  const lang = (req.params.lang || 'fr').toLowerCase();
  return ['fr', 'en', 'ar'].includes(lang) ? lang : 'fr';
};

const getDayIndex = (req) => {
  const dayNumber = parseInt(req.params.day, 10);
  if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > TOTAL_DAYS) return null;
  return dayNumber - 1;
};

const getOrCreateVarkTest = async (userId) => {
  let test = await VarkTest.findOne({ userId });
  if (!test) {
    test = await VarkTest.create({ userId });
  }
  return test;
};

// GET /vark/:day/start?lang=fr
exports.getVarkQuestion = async (req, res, next) => {
  try {
    const lang = getLanguage(req);
    const idx = getDayIndex(req);
    if (idx === null) {
      return res.status(400).json({ error: 'Invalid day. Must be between 1 and 21.' });
    }

    const item = varkData.VARK[idx];
    if (!item) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const question = item.question?.[lang] || item.question?.fr;
    const optionsRaw = item.options || {};
    const options = {};
    for (const key of Object.keys(optionsRaw)) {
      const opt = optionsRaw[key];
      options[key] = opt?.[lang] || opt?.fr;
    }

    // Progress data
    const test = await getOrCreateVarkTest(req.user._id || req.user.id);
    const answeredDays = new Set(test.answers.map(a => a.questionIndex + 1));

    res.json({
      day: idx + 1,
      question,
      options, // { V, A, R, K }: localized strings
      progress: {
        totalAnswered: test.answers.length,
        completed: !!test.completed,
        answeredDays: Array.from(answeredDays).sort((a,b)=>a-b),
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /vark/:day/submit { selectedStyle: 'V'|'A'|'R'|'K' }
exports.submitVarkAnswer = async (req, res, next) => {
  try {
    const idx = getDayIndex(req);
    if (idx === null) {
      return res.status(400).json({ error: 'Invalid day. Must be between 1 and 21.' });
    }
    const { selectedStyle } = req.body;
    if (!['V', 'A', 'R', 'K'].includes(selectedStyle)) {
      return res.status(400).json({ error: 'Invalid style. Must be one of V, A, R, K.' });
    }

    const test = await getOrCreateVarkTest(req.user._id || req.user.id);

    // Replace or insert answer for this day
    const existingIdx = test.answers.findIndex(a => a.questionIndex === idx);
    if (existingIdx >= 0) {
      // Adjust counts: decrement previous, increment new
      const prev = test.answers[existingIdx].selectedStyle;
      if (prev !== selectedStyle) {
        test.styleCounts[prev] = Math.max(0, (test.styleCounts[prev] || 0) - 1);
        test.answers[existingIdx].selectedStyle = selectedStyle;
        test.styleCounts[selectedStyle] = (test.styleCounts[selectedStyle] || 0) + 1;
      }
    } else {
      test.answers.push({ questionIndex: idx, selectedStyle });
      test.styleCounts[selectedStyle] = (test.styleCounts[selectedStyle] || 0) + 1;
    }

    // If all 21 answered, mark completed and compute dominant style
    if (test.answers.length === TOTAL_DAYS) {
      test.completed = true;
      test.completedAt = new Date();
      const entries = Object.entries(test.styleCounts);
      let dominant = null;
      let max = -1;
      for (const [style, count] of entries) {
        if (count > max) { max = count; dominant = style; }
      }
      test.dominantStyle = dominant;
    } else {
      test.completed = false;
      test.dominantStyle = undefined;
      test.completedAt = undefined;
    }

    await test.save();

    res.json({
      success: true,
      day: idx + 1,
      styleCounts: test.styleCounts,
      totalAnswered: test.answers.length,
      completed: test.completed,
    });
  } catch (err) {
    next(err);
  }
};

// GET /vark/result
exports.getVarkResult = async (req, res, next) => {
  try {
    const test = await getOrCreateVarkTest(req.user._id || req.user.id);
    if (!test.completed || test.answers.length !== TOTAL_DAYS) {
      return res.status(400).json({
        error: 'VARK result unavailable until all 21 days are completed.'
      });
    }
    res.json({
      totalAnswered: test.answers.length,
      styleCounts: test.styleCounts,
      dominantStyle: test.dominantStyle,
      completedAt: test.completedAt,
    });
  } catch (err) {
    next(err);
  }
};

// POST /vark/reset
exports.resetVarkQuiz = async (req, res, next) => {
  try {
    const test = await getOrCreateVarkTest(req.user._id || req.user.id);
    test.answers = [];
    test.styleCounts = { V: 0, A: 0, R: 0, K: 0 };
    test.dominantStyle = undefined;
    test.completed = false;
    test.completedAt = undefined;
    await test.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
