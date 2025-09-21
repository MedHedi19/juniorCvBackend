const UserProgress = require('../models/UserProgress');
const { getQuizByIndex, getAllQuizNames } = require('../utils/quizData');


// Get all quizzes with user progress
const getQuizzes = async (req, res) => {
  console.log('Step: Entering getQuizzes');
  try {
    const userId = req.user.id;
    console.log(`Step: Fetching quizzes for user ${userId}`);
    const allQuizzes = getAllQuizNames();

    // Get or create user progress
    let userProgress = await UserProgress.findOne({ userId });
    console.log(`Step: User progress found: ${!!userProgress}`);
    if (!userProgress) {
      console.log('Step: Initializing new user progress');
      // Initialize progress for new user
      const initialProgress = allQuizzes.map(quiz => ({
        quizName: quiz.name,
        completed: false,
        score: 0,
        totalQuestions: quiz.totalQuestions,
        percentage: 0,
        answers: []
      }));

      userProgress = new UserProgress({
        userId,
        quizProgress: initialProgress,
        currentQuizIndex: 0
      });
      await userProgress.save();
      console.log('Step: New user progress saved');
    }

    // Format response with lock status
    const quizzesWithProgress = allQuizzes.map((quiz, index) => {
      const progress = userProgress.quizProgress.find(p => p.quizName === quiz.name) || {
        completed: false,
        score: 0,
        percentage: 0
      };

      return {
        id: quiz.id,
        name: quiz.name,
        totalQuestions: quiz.totalQuestions,
        completed: progress.completed,
        score: progress.score,
        percentage: progress.percentage,
        locked: index > userProgress.currentQuizIndex,
        completedAt: progress.completedAt
      };
    });
    console.log(`Step: Formatted ${quizzesWithProgress.length} quizzes`);

    res.json({
      quizzes: quizzesWithProgress,
      currentQuizIndex: userProgress.currentQuizIndex
    });
    console.log('Step: getQuizzes response sent');
  } catch (error) {
    console.error('Error getting quizzes:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Start a quiz (get first question)
const startQuiz = async (req, res) => {
  console.log('Step: Entering startQuiz');
  try {
    const { quizId } = req.params;
    const lang = req.query.lang || 'fr';
    console.log(`Step: Starting quiz ${quizId} with lang ${lang}`);
    const userId = req.user.id;

    const quiz = getQuizByIndex(parseInt(quizId));
    if (!quiz) {
      console.log('Step: Quiz not found');
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if quiz is unlocked
    const userProgress = await UserProgress.findOne({ userId });
    console.log(`Step: User progress found: ${!!userProgress}`);
    if (!userProgress) {
      return res.status(400).json({ message: 'User progress not found' });
    }

    if (parseInt(quizId) > userProgress.currentQuizIndex) {
      console.log('Step: Quiz is locked');
      return res.status(403).json({ message: 'Quiz is locked. Complete previous quizzes first.' });
    }

    // Find or create quiz progress
    let quizProgress = userProgress.quizProgress.find(p => p.quizName === quiz.name);
    if (!quizProgress) {
      console.log('Step: Creating new quiz progress');
      quizProgress = {
        quizName: quiz.name,
        completed: false,
        score: 0,
        totalQuestions: quiz.questions.length,
        percentage: 0,
        answers: []
      };
      userProgress.quizProgress.push(quizProgress);
    } else if (!quizProgress.completed) {
      // Reset progress if quiz is not completed
      console.log('Step: Resetting incomplete quiz progress');
      quizProgress.answers = [];
      quizProgress.score = 0;
      quizProgress.percentage = 0;
      quizProgress.completedAt = null;
    }

    // Check if quiz is already completed
    if (quizProgress.completed) {
      console.log('Step: Quiz already completed');
      return res.status(400).json({ message: 'Quiz already completed' });
    }

    // Always start from first question
    const questionIndex = 0;
    const firstQuestion = {
      questionIndex,
      question: quiz.questions[questionIndex].question[lang],
      options: quiz.questions[questionIndex].options.map(opt => opt[lang]),
      totalQuestions: quiz.questions.length,
      quizName: quiz.name
    };
    console.log('Step: Prepared first question');

    await userProgress.save();
    console.log('Step: User progress saved');
    res.json(firstQuestion);
    console.log('Step: startQuiz response sent');
  } catch (error) {
    console.error('Error starting quiz:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Submit answer for a question
const submitAnswer = async (req, res) => {
  console.log('Step: Entering submitAnswer');
  try {
    const { quizId } = req.params;
    const { questionIndex, selectedAnswer, lang = 'fr' } = req.body;
    console.log(`Step: Submitting answer for quiz ${quizId}, question ${questionIndex}, answer: ${selectedAnswer}, lang: ${lang}`);
    const userId = req.user.id;

    const quiz = getQuizByIndex(parseInt(quizId));
    if (!quiz) {
      console.log('Step: Quiz not found');
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (questionIndex < 0 || questionIndex >= quiz.questions.length) {
      console.log('Step: Invalid question index');
      return res.status(400).json({ message: 'Invalid question index' });
    }

    const userProgress = await UserProgress.findOne({ userId });
    console.log(`Step: User progress found: ${!!userProgress}`);
    if (!userProgress) {
      return res.status(400).json({ message: 'User progress not found' });
    }

    let quizProgress = userProgress.quizProgress.find(p => p.quizName === quiz.name);
    if (!quizProgress) {
      console.log('Step: Creating new quiz progress');
      quizProgress = {
        quizName: quiz.name,
        completed: false,
        score: 0,
        totalQuestions: quiz.questions.length,
        percentage: 0,
        answers: []
      };
      userProgress.quizProgress.push(quizProgress);
    }

    if (quizProgress.completed) {
      console.log('Step: Quiz already completed');
      return res.status(400).json({ message: 'Quiz already completed' });
    }

    if (quizProgress.answers.find(a => a.questionIndex === questionIndex)) {
      console.log(`Step: Question ${questionIndex} already answered`);
      return res.status(400).json({ message: 'Question already answered' });
    }

    const currentQuestion = quiz.questions[questionIndex];
    const isCorrect = selectedAnswer ? currentQuestion.correct[lang] === selectedAnswer : false;
    console.log(`Step: Answer correct: ${isCorrect}`);

    // Handle null or invalid answers
    let selectedFr = null;
    if (selectedAnswer) {
      const selectedIndex = currentQuestion.options.findIndex(opt => opt[lang] === selectedAnswer);
      if (selectedIndex === -1) {
        console.log('Step: Invalid selected answer, treating as incorrect');
      } else {
        selectedFr = currentQuestion.options[selectedIndex].fr;
        console.log(`Step: Selected French answer: ${selectedFr}`);
      }
    }

    // Save answer
    quizProgress.answers.push({
      questionIndex,
      selectedAnswer: selectedFr,
      isCorrect
    });
    console.log('Step: Answer saved in French');

    // Update score and percentage
    quizProgress.score = quizProgress.answers.filter(a => a.isCorrect).length;
    quizProgress.percentage = Math.round((quizProgress.score / quiz.questions.length) * 100);
    console.log(`Step: Updated score: ${quizProgress.score}, percentage: ${quizProgress.percentage}`);

    const response = {
      isCorrect,
      correctAnswer: currentQuestion.correct[lang],
      currentScore: quizProgress.score,
      totalQuestions: quiz.questions.length
    };

    // Check if this is the last question
    if (questionIndex + 1 >= quiz.questions.length) {
      console.log('Step: All questions answered, marking quiz as completed');
      quizProgress.completed = true;
      quizProgress.completedAt = new Date();

      // Unlock next quiz if this one is passed
      if (userProgress.currentQuizIndex === parseInt(quizId)) {
        userProgress.currentQuizIndex = Math.min(userProgress.currentQuizIndex + 1, 6);
      }

      response.quizCompleted = true;
      response.finalScore = quizProgress.score;
      response.percentage = quizProgress.percentage;
      response.passed = quizProgress.percentage >= 50;
    } else {
      console.log('Step: Preparing next question');
      const nextQuestion = quiz.questions[questionIndex + 1];
      response.nextQuestion = {
        questionIndex: questionIndex + 1,
        question: nextQuestion.question[lang],
        options: nextQuestion.options.map(opt => opt[lang]),
        totalQuestions: quiz.questions.length,
        quizName: quiz.name
      };
    }

    await userProgress.save();
    console.log('Step: User progress saved');
    res.json(response);
    console.log('Step: submitAnswer response sent');
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get quiz results
const getQuizResult = async (req, res) => {
  console.log('Step: Entering getQuizResult');
  try {
    const { quizId } = req.params;
    const lang = req.query.lang || 'fr';
    console.log(`Step: Getting result for quiz ${quizId}, lang ${lang}`);
    const userId = req.user.id;

    const quiz = getQuizByIndex(parseInt(quizId));
    if (!quiz) {
      console.log('Step: Quiz not found');
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const userProgress = await UserProgress.findOne({ userId });
    console.log(`Step: User progress found: ${!!userProgress}`);
    if (!userProgress) {
      return res.status(400).json({ message: 'User progress not found' });
    }

    const quizProgress = userProgress.quizProgress.find(p => p.quizName === quiz.name);
    if (!quizProgress || !quizProgress.completed) {
      console.log('Step: Quiz not completed');
      return res.status(400).json({ message: 'Quiz not completed yet' });
    }

    // Format answers with language
    const formattedAnswers = quizProgress.answers.map((answer) => {
      const currentQuestion = quiz.questions[answer.questionIndex];
      const selectedIndex = currentQuestion.options.findIndex(opt => opt.fr === answer.selectedAnswer);
      const selectedInLang = selectedIndex !== -1 ? currentQuestion.options[selectedIndex][lang] : answer.selectedAnswer;

      return {
        questionIndex: answer.questionIndex,
        question: currentQuestion.question[lang],
        selectedAnswer: selectedInLang,
        correctAnswer: currentQuestion.correct[lang],
        isCorrect: answer.isCorrect
      };
    });
    console.log(`Step: Formatted ${formattedAnswers.length} answers`);

    res.json({
      quizName: quiz.name,
      score: quizProgress.score,
      totalQuestions: quizProgress.totalQuestions,
      percentage: quizProgress.percentage,
      passed: quizProgress.percentage >= 50,
      completedAt: quizProgress.completedAt,
      answers: formattedAnswers
    });
    console.log('Step: getQuizResult response sent');
  } catch (error) {
    console.error('Error getting quiz result:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Reset quiz progress (for retaking)
const resetQuiz = async (req, res) => {
  console.log('Step: Entering resetQuiz');
  try {
    const { quizId } = req.params;
    const userId = req.user.id;
    console.log(`Step: Resetting quiz ${quizId} for user ${userId}`);

    const quiz = getQuizByIndex(parseInt(quizId));
    if (!quiz) {
      console.log('Step: Quiz not found');
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const userProgress = await UserProgress.findOne({ userId });
    console.log(`Step: User progress found: ${!!userProgress}`);
    if (!userProgress) {
      return res.status(400).json({ message: 'User progress not found' });
    }

    const quizProgressIndex = userProgress.quizProgress.findIndex(p => p.quizName === quiz.name);
    if (quizProgressIndex >= 0) {
      userProgress.quizProgress[quizProgressIndex] = {
        quizName: quiz.name,
        completed: false,
        score: 0,
        totalQuestions: quiz.questions.length,
        percentage: 0,
        answers: []
      };
      await userProgress.save();
      console.log('Step: Quiz progress reset');
    }

    res.json({ message: 'Quiz reset successfully' });
    console.log('Step: resetQuiz response sent');
  } catch (error) {
    console.error('Error resetting quiz:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

module.exports = {
  getQuizzes,
  startQuiz,
  submitAnswer,
  getQuizResult,
  resetQuiz
};