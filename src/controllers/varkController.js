const VarkTest = require('../models/varkTest');
const varkData = require('../data/vark/vark.json');

// Helper: transform options object to array format
const transformOptionsToArray = (optionsObj, lang) => {
  return Object.entries(optionsObj).map(([style, texts]) => ({
    style,
    text: texts[lang] || texts['fr']
  }));
};

// Get VARK question for a specific day (1..21)
const getVarkQuestion = async (req, res) => {
  try {
    const language = (req.query.language || 'fr').toLowerCase();
    const day = parseInt(req.query.day, 10);

    if (!day || day < 1 || day > 21) {
      return res.status(400).json({ message: 'Invalid day. Must be between 1 and 21.' });
    }

    const questions = varkData?.VARK || [];
    if (!questions.length) {
      return res.status(404).json({ message: 'VARK questions not found' });
    }

    const idx = day - 1;
    const q = questions[idx];
    if (!q) {
      return res.status(404).json({ message: 'Question not found for this day' });
    }

    const questionText = q.question[language] || q.question['fr'];
    const options = transformOptionsToArray(q.options, language);

    return res.json({
      day,
      question: questionText,
      options,
      totalDays: 21,
      testName: 'VARK'
    });
  } catch (error) {
    console.error('Error getting VARK question:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Submit VARK answer for a specific day
const submitVarkAnswer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { day, selectedStyle } = req.body;
    const language = (req.body.language || req.query.language || 'fr').toLowerCase();

    const dayNum = parseInt(day, 10);
    if (!dayNum || dayNum < 1 || dayNum > 21) {
      return res.status(400).json({ message: 'Invalid day. Must be between 1 and 21.' });
    }

    const validStyles = ['V', 'A', 'R', 'K'];
    if (!validStyles.includes(selectedStyle)) {
      return res.status(400).json({ message: 'Invalid style. Must be one of V, A, R, K.' });
    }

    // Find or create user VARK test progress
    let varkTest = await VarkTest.findOne({ userId });
    if (!varkTest) {
      varkTest = new VarkTest({
        userId,
        completed: false,
        answers: [],
        styleCounts: { V: 0, A: 0, R: 0, K: 0 },
        dominantStyle: null,
      });
    }

    const questionIndex = dayNum - 1;

    // Update or add answer
    const existingIdx = varkTest.answers.findIndex(a => a.questionIndex === questionIndex);
    if (existingIdx >= 0) {
      // decrement old style count
      const oldStyle = varkTest.answers[existingIdx].selectedStyle;
      if (oldStyle && varkTest.styleCounts[oldStyle] !== undefined) {
        varkTest.styleCounts[oldStyle] = Math.max(0, (varkTest.styleCounts[oldStyle] || 0) - 1);
      }
      // update answer
      varkTest.answers[existingIdx] = { questionIndex, selectedStyle };
    } else {
      varkTest.answers.push({ questionIndex, selectedStyle });
    }

    // increment new style count
    varkTest.styleCounts[selectedStyle] = (varkTest.styleCounts[selectedStyle] || 0) + 1;

    const response = { day: dayNum, saved: true };

    // Check completion (all 21 answered)
    const uniqueAnswered = new Set(varkTest.answers.map(a => a.questionIndex));
    if (uniqueAnswered.size === 21) {
      varkTest.completed = true;
      varkTest.completedAt = new Date();
      // Compute dominant style
      const styles = Object.keys(varkTest.styleCounts);
      varkTest.dominantStyle = styles.reduce((a, b) => 
        (varkTest.styleCounts[a] || 0) >= (varkTest.styleCounts[b] || 0) ? a : b
      );
      response.testCompleted = true;
      response.styleCounts = varkTest.styleCounts;
      response.dominantStyle = varkTest.dominantStyle;
    } else {
      response.testCompleted = false;
      response.nextDay = dayNum < 21 ? dayNum + 1 : null;
    }

    await varkTest.save();
    return res.json(response);
  } catch (error) {
    console.error('Error submitting VARK answer:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get VARK result (only after completion)
const getVarkResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const varkTest = await VarkTest.findOne({ userId });

    if (!varkTest) {
      return res.status(404).json({ message: 'No VARK results found' });
    }
    if (!varkTest.completed) {
      return res.status(400).json({ message: 'VARK test not completed yet' });
    }

    return res.json({
      styleCounts: varkTest.styleCounts,
      dominantStyle: varkTest.dominantStyle,
      completedAt: varkTest.completedAt,
      answers: varkTest.answers,
    });
  } catch (error) {
    console.error('Error getting VARK result:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Optional: reset VARK test
const resetVarkTest = async (req, res) => {
  try {
    const userId = req.user.id;
    const varkTest = await VarkTest.findOne({ userId });
    if (!varkTest) {
      return res.status(400).json({ message: 'VARK test not found' });
    }

    varkTest.completed = false;
    varkTest.answers = [];
    varkTest.styleCounts = { V: 0, A: 0, R: 0, K: 0 };
    varkTest.dominantStyle = null;
    varkTest.completedAt = null;

    await varkTest.save();
    return res.json({ message: 'VARK test reset successfully' });
  } catch (error) {
    console.error('Error resetting VARK test:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all daily VARK results with completion status
const getAllDailyResults = async (req, res) => {
  try {
    const userId = req.user.id;
    const varkTest = await VarkTest.findOne({ userId });

    if (!varkTest) {
      return res.status(404).json({ message: 'No VARK test found' });
    }

    // Create a map of answered days for quick lookup
    // Note: answers are stored with questionIndex (0-20), we need to convert to day (1-21)
    const answeredDays = {};
    varkTest.answers.forEach(answer => {
      const day = answer.questionIndex + 1; // Convert questionIndex to day
      answeredDays[day] = {
        day,
        completed: true,
        selectedStyle: answer.selectedStyle,
        answeredAt: answer.answeredAt || null
      };
    });

    // Build array of all 21 days with their status
    const dailyResults = [];
    for (let day = 1; day <= 21; day++) {
      if (answeredDays[day]) {
        dailyResults.push(answeredDays[day]);
      } else {
        dailyResults.push({
          day,
          completed: false,
          selectedStyle: null,
          answeredAt: null
        });
      }
    }

    return res.json({
      dailyResults,
      totalDays: 21,
      completedDays: varkTest.answers.length,
      overallCompleted: varkTest.completed,
      styleCounts: varkTest.styleCounts,
      dominantStyle: varkTest.dominantStyle
    });
  } catch (error) {
    console.error('Error getting all daily results:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

module.exports = {
  getVarkQuestion,
  submitVarkAnswer,
  getVarkResult,
  resetVarkTest,
  getAllDailyResults,
};
