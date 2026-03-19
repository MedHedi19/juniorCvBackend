const UserProgress = require('../models/userProgress');
const {
  MAX_QUESTIONS_PER_ATTEMPT,
  getAllQuizModules,
  getQuizModuleByOrder,
  buildQuestionSnapshotsFromIds,
  buildQuestionSnapshotsFromIndexes,
  pickRandomQuestionSnapshots,
} = require('../utils/quizModuleService');

const SUPPORTED_LANGUAGES = new Set(['fr', 'en', 'ar']);
const DEFAULT_LANGUAGE = 'fr';

const normalizeLanguage = (language) =>
  SUPPORTED_LANGUAGES.has(language) ? language : DEFAULT_LANGUAGE;

const parseQuizOrder = (quizId) => {
  const parsed = Number.parseInt(quizId, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const getLocalizedText = (value, language) => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  if (language === 'fr' && value.fr) {
    return value.fr;
  }

  if (language === 'en' && value.en) {
    return value.en;
  }

  if (language === 'ar' && value.ar) {
    return value.ar;
  }

  return value.fr || value.en || value.ar || null;
};

const getItemByIndex = (items, targetIndex) => {
  if (!Array.isArray(items) || !Number.isInteger(targetIndex) || targetIndex < 0) {
    return null;
  }

  return items.find((item, index) => index === targetIndex) || null;
};

const createInitialQuizProgress = (quizModule) => ({
  moduleId: quizModule._id,
  moduleSlug: quizModule.slug,
  moduleVersion: quizModule.version,
  quizName: quizModule.name,
  completed: false,
  score: 0,
  totalQuestions: Math.min(MAX_QUESTIONS_PER_ATTEMPT, quizModule.questions.length),
  percentage: 0,
  completedAt: null,
  selectedQuestions: [],
  selectedQuestionIds: [],
  selectedQuestionSnapshots: [],
  answers: [],
});

const ensureQuizProgressMetadata = (quizProgress, quizModule) => {
  quizProgress.moduleId = quizModule._id;
  quizProgress.moduleSlug = quizModule.slug;
  quizProgress.moduleVersion = quizModule.version;
  quizProgress.quizName = quizModule.name;
};

const isProgressForModule = (quizProgress, quizModule) => {
  if (!quizProgress || !quizModule) {
    return false;
  }

  if (quizProgress.moduleId && String(quizProgress.moduleId) === String(quizModule._id)) {
    return true;
  }

  if (quizProgress.moduleSlug && quizProgress.moduleSlug === quizModule.slug) {
    return true;
  }

  return quizProgress.quizName === quizModule.name;
};

const findQuizProgress = (quizProgressList, quizModule) =>
  quizProgressList.find((entry) => isProgressForModule(entry, quizModule));

const getMaxQuizOrder = (quizModules) => {
  if (!Array.isArray(quizModules) || quizModules.length === 0) {
    return 0;
  }

  return Math.max(...quizModules.map((quizModule) => quizModule.order));
};

const getNextQuizOrder = (quizModules, currentQuizOrder) => {
  const sortedOrders = (quizModules || [])
    .map((quizModule) => quizModule.order)
    .sort((a, b) => a - b);

  const currentIndex = sortedOrders.indexOf(currentQuizOrder);
  if (currentIndex === -1 || currentIndex >= sortedOrders.length - 1) {
    return currentQuizOrder;
  }

  return sortedOrders[currentIndex + 1];
};

const ensureBaseUserProgress = async (userId) => {
  const quizModules = await getAllQuizModules();
  let userProgress = await UserProgress.findOne({ userId });
  let shouldSave = false;

  if (!userProgress) {
    userProgress = new UserProgress({
      userId,
      quizProgress: quizModules.map((quizModule) => createInitialQuizProgress(quizModule)),
      currentQuizIndex: 0,
    });
    await userProgress.save();
    return { userProgress, quizModules };
  }

  quizModules.forEach((quizModule) => {
    const existingProgress = findQuizProgress(userProgress.quizProgress, quizModule);
    if (!existingProgress) {
      userProgress.quizProgress.push(createInitialQuizProgress(quizModule));
      shouldSave = true;
      return;
    }

    const previousModuleId = existingProgress.moduleId ? String(existingProgress.moduleId) : null;
    ensureQuizProgressMetadata(existingProgress, quizModule);

    if (previousModuleId !== String(quizModule._id)) {
      shouldSave = true;
    }

    if (!existingProgress.totalQuestions) {
      existingProgress.totalQuestions = Math.min(
        MAX_QUESTIONS_PER_ATTEMPT,
        quizModule.questions.length
      );
      shouldSave = true;
    }
  });

  const maxQuizOrder = getMaxQuizOrder(quizModules);
  if (userProgress.currentQuizIndex > maxQuizOrder) {
    userProgress.currentQuizIndex = maxQuizOrder;
    shouldSave = true;
  }

  if (shouldSave) {
    await userProgress.save();
  }

  return { userProgress, quizModules };
};

const ensureQuestionSnapshots = (quizProgress, quizModule) => {
  let snapshots = Array.isArray(quizProgress.selectedQuestionSnapshots)
    ? quizProgress.selectedQuestionSnapshots.filter((snapshot) => snapshot && snapshot.question)
    : [];

  if (snapshots.length === 0) {
    snapshots = buildQuestionSnapshotsFromIds(quizModule, quizProgress.selectedQuestionIds);
  }

  if (snapshots.length === 0) {
    snapshots = buildQuestionSnapshotsFromIndexes(quizModule, quizProgress.selectedQuestions);
  }

  if (snapshots.length === 0) {
    snapshots = pickRandomQuestionSnapshots(quizModule, MAX_QUESTIONS_PER_ATTEMPT);
  }

  quizProgress.selectedQuestionSnapshots = snapshots;
  quizProgress.selectedQuestionIds = snapshots.map((snapshot) => snapshot.questionId);

  if (!Array.isArray(quizProgress.selectedQuestions)) {
    quizProgress.selectedQuestions = [];
  }

  quizProgress.totalQuestions = snapshots.length;

  return snapshots;
};

const attachSnapshotsToLegacyAnswers = (quizProgress, questionSnapshots) => {
  if (!Array.isArray(quizProgress.answers) || quizProgress.answers.length === 0) {
    return;
  }

  quizProgress.answers.forEach((answer) => {
    if (!answer || (answer.questionSnapshot && answer.questionSnapshot.question)) {
      return;
    }

    const snapshot = getItemByIndex(questionSnapshots, answer.questionIndex);
    if (!snapshot) {
      return;
    }

    answer.questionId = answer.questionId || snapshot.questionId;
    answer.questionSnapshot = snapshot;
  });
};

const toQuestionPayload = (snapshot, language, questionIndex, quizName, totalQuestions) => ({
  questionIndex,
  question: getLocalizedText(snapshot.question, language),
  options: (snapshot.options || []).map((option) => getLocalizedText(option, language)),
  totalQuestions,
  quizName,
});

const findOptionIndexByLanguageValue = (options, language, selectedValue) => {
  if (!Array.isArray(options)) {
    return -1;
  }

  return options.findIndex((option) => getLocalizedText(option, language) === selectedValue);
};

// Get all quizzes with user progress
const getQuizzes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userProgress, quizModules } = await ensureBaseUserProgress(userId);

    const quizzesWithProgress = quizModules.map((quizModule) => {
      const progress =
        findQuizProgress(userProgress.quizProgress, quizModule) ||
        createInitialQuizProgress(quizModule);

      return {
        id: quizModule.order,
        name: quizModule.name,
        totalQuestions:
          progress.totalQuestions ||
          Math.min(MAX_QUESTIONS_PER_ATTEMPT, quizModule.questions.length),
        completed: Boolean(progress.completed),
        score: progress.score || 0,
        percentage: progress.percentage || 0,
        locked: quizModule.order > userProgress.currentQuizIndex,
        completedAt: progress.completedAt || null,
      };
    });

    res.json({
      quizzes: quizzesWithProgress,
      currentQuizIndex: userProgress.currentQuizIndex,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Start a quiz (get first question)
const startQuiz = async (req, res) => {
  try {
    const quizOrder = parseQuizOrder(req.params.quizId);
    if (quizOrder === null) {
      return res.status(400).json({ message: 'Invalid quiz id' });
    }

    const language = normalizeLanguage(req.query.lang || DEFAULT_LANGUAGE);
    const userId = req.user.id;

    const quizModule = await getQuizModuleByOrder(quizOrder);
    if (!quizModule) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const { userProgress } = await ensureBaseUserProgress(userId);
    if (quizOrder > userProgress.currentQuizIndex) {
      return res.status(403).json({ message: 'Quiz is locked. Complete previous quizzes first.' });
    }

    let quizProgress = findQuizProgress(userProgress.quizProgress, quizModule);
    if (!quizProgress) {
      quizProgress = createInitialQuizProgress(quizModule);
      userProgress.quizProgress.push(quizProgress);
    }

    ensureQuizProgressMetadata(quizProgress, quizModule);

    if (quizProgress.completed) {
      return res.status(400).json({ message: 'Quiz already completed' });
    }

    // Restart incomplete attempts from question 1 while preserving selected question set.
    quizProgress.answers = [];
    quizProgress.score = 0;
    quizProgress.percentage = 0;
    quizProgress.completedAt = null;

    const questionSnapshots = ensureQuestionSnapshots(quizProgress, quizModule);
    const firstQuestionSnapshot = getItemByIndex(questionSnapshots, 0);
    if (!firstQuestionSnapshot) {
      return res.status(400).json({ message: 'No questions configured for this quiz' });
    }

    const firstQuestion = toQuestionPayload(
      firstQuestionSnapshot,
      language,
      0,
      quizProgress.quizName,
      questionSnapshots.length
    );

    await userProgress.save();
    return res.json(firstQuestion);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Submit answer for a question
const submitAnswer = async (req, res) => {
  try {
    const quizOrder = parseQuizOrder(req.params.quizId);
    if (quizOrder === null) {
      return res.status(400).json({ message: 'Invalid quiz id' });
    }

    const parsedQuestionIndex = Number.parseInt(req.body.questionIndex, 10);
    if (Number.isNaN(parsedQuestionIndex)) {
      return res.status(400).json({ message: 'Invalid question index' });
    }

    const selectedAnswer = req.body.selectedAnswer || null;
    const language = normalizeLanguage(req.body.lang || DEFAULT_LANGUAGE);
    const userId = req.user.id;

    const { userProgress, quizModules } = await ensureBaseUserProgress(userId);
    const quizModule = quizModules.find((module) => module.order === quizOrder);
    if (!quizModule) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quizOrder > userProgress.currentQuizIndex) {
      return res.status(403).json({ message: 'Quiz is locked. Complete previous quizzes first.' });
    }

    let quizProgress = findQuizProgress(userProgress.quizProgress, quizModule);
    if (!quizProgress) {
      quizProgress = createInitialQuizProgress(quizModule);
      userProgress.quizProgress.push(quizProgress);
    }

    ensureQuizProgressMetadata(quizProgress, quizModule);

    if (quizProgress.completed) {
      return res.status(400).json({ message: 'Quiz already completed' });
    }

    const questionSnapshots = ensureQuestionSnapshots(quizProgress, quizModule);
    if (parsedQuestionIndex < 0 || parsedQuestionIndex >= questionSnapshots.length) {
      return res.status(400).json({ message: 'Invalid question index' });
    }

    if (quizProgress.answers.find((answer) => answer.questionIndex === parsedQuestionIndex)) {
      return res.status(400).json({ message: 'Question already answered' });
    }

    const currentQuestionSnapshot = getItemByIndex(questionSnapshots, parsedQuestionIndex);
    if (!currentQuestionSnapshot) {
      return res.status(400).json({ message: 'Question not found' });
    }

    const correctAnswerInLanguage = getLocalizedText(currentQuestionSnapshot.correct, language);
    const isCorrect = Boolean(selectedAnswer) && selectedAnswer === correctAnswerInLanguage;

    let selectedAnswerInFrench = null;
    if (selectedAnswer) {
      const selectedOptionIndex = findOptionIndexByLanguageValue(
        currentQuestionSnapshot.options,
        language,
        selectedAnswer
      );

      if (selectedOptionIndex !== -1) {
        const selectedOption = getItemByIndex(currentQuestionSnapshot.options, selectedOptionIndex);
        selectedAnswerInFrench = selectedOption ? selectedOption.fr : null;
      }
    }

    quizProgress.answers.push({
      questionIndex: parsedQuestionIndex,
      questionId: currentQuestionSnapshot.questionId,
      selectedAnswer: selectedAnswerInFrench,
      isCorrect,
      questionSnapshot: currentQuestionSnapshot,
      answeredAt: new Date(),
    });

    quizProgress.score = quizProgress.answers.filter((answer) => answer.isCorrect).length;
    quizProgress.percentage = Math.round((quizProgress.score / questionSnapshots.length) * 100);

    const response = {
      isCorrect,
      correctAnswer: correctAnswerInLanguage,
      currentScore: quizProgress.score,
      totalQuestions: questionSnapshots.length,
    };

    const isLastQuestion = parsedQuestionIndex + 1 >= questionSnapshots.length;
    if (isLastQuestion) {
      quizProgress.completed = true;
      quizProgress.completedAt = new Date();

      if (userProgress.currentQuizIndex === quizOrder) {
        userProgress.currentQuizIndex = getNextQuizOrder(quizModules, quizOrder);
      }

      response.quizCompleted = true;
      response.finalScore = quizProgress.score;
      response.percentage = quizProgress.percentage;
      response.passed = quizProgress.percentage >= 50;
    } else {
      const nextQuestionIndex = parsedQuestionIndex + 1;
      const nextQuestionSnapshot = getItemByIndex(questionSnapshots, nextQuestionIndex);
      if (!nextQuestionSnapshot) {
        return res.status(400).json({ message: 'Next question not found' });
      }

      response.nextQuestion = toQuestionPayload(
        nextQuestionSnapshot,
        language,
        nextQuestionIndex,
        quizProgress.quizName,
        questionSnapshots.length
      );
    }

    await userProgress.save();
    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Get quiz results
const getQuizResult = async (req, res) => {
  try {
    const quizOrder = parseQuizOrder(req.params.quizId);
    if (quizOrder === null) {
      return res.status(400).json({ message: 'Invalid quiz id' });
    }

    const language = normalizeLanguage(req.query.lang || DEFAULT_LANGUAGE);
    const userId = req.user.id;

    const quizModule = await getQuizModuleByOrder(quizOrder);
    if (!quizModule) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const { userProgress } = await ensureBaseUserProgress(userId);
    const quizProgress = findQuizProgress(userProgress.quizProgress, quizModule);

    if (!quizProgress || !quizProgress.completed) {
      return res.status(400).json({ message: 'Quiz not completed yet' });
    }

    ensureQuizProgressMetadata(quizProgress, quizModule);
    const questionSnapshots = ensureQuestionSnapshots(quizProgress, quizModule);
    attachSnapshotsToLegacyAnswers(quizProgress, questionSnapshots);

    const formattedAnswers = quizProgress.answers.map((answer) => {
      const questionSnapshot =
        answer.questionSnapshot && answer.questionSnapshot.question
          ? answer.questionSnapshot
          : getItemByIndex(questionSnapshots, answer.questionIndex);

      if (!questionSnapshot || !questionSnapshot.question) {
        return {
          questionIndex: answer.questionIndex,
          question: null,
          selectedAnswer: answer.selectedAnswer,
          correctAnswer: null,
          isCorrect: answer.isCorrect,
        };
      }

      const selectedOptionIndex = (questionSnapshot.options || []).findIndex(
        (option) => option.fr === answer.selectedAnswer
      );

      const selectedOption = getItemByIndex(questionSnapshot.options, selectedOptionIndex);
      const selectedAnswerInLanguage = selectedOption
        ? getLocalizedText(selectedOption, language)
        : answer.selectedAnswer;

      return {
        questionIndex: answer.questionIndex,
        question: getLocalizedText(questionSnapshot.question, language),
        selectedAnswer: selectedAnswerInLanguage,
        correctAnswer: getLocalizedText(questionSnapshot.correct, language),
        isCorrect: answer.isCorrect,
      };
    });

    await userProgress.save();

    return res.json({
      quizName: quizProgress.quizName,
      score: quizProgress.score,
      totalQuestions: quizProgress.totalQuestions || questionSnapshots.length,
      percentage: quizProgress.percentage,
      passed: quizProgress.percentage >= 50,
      completedAt: quizProgress.completedAt,
      answers: formattedAnswers,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Reset quiz progress (for retaking)
const resetQuiz = async (req, res) => {
  try {
    const quizOrder = parseQuizOrder(req.params.quizId);
    if (quizOrder === null) {
      return res.status(400).json({ message: 'Invalid quiz id' });
    }

    const userId = req.user.id;
    const quizModule = await getQuizModuleByOrder(quizOrder);
    if (!quizModule) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const { userProgress } = await ensureBaseUserProgress(userId);
    const quizProgressIndex = userProgress.quizProgress.findIndex((progress) =>
      isProgressForModule(progress, quizModule)
    );

    if (quizProgressIndex >= 0) {
      userProgress.quizProgress.splice(quizProgressIndex, 1, createInitialQuizProgress(quizModule));
      await userProgress.save();
    }

    return res.json({ message: 'Quiz reset successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

module.exports = {
  getQuizzes,
  startQuiz,
  submitAnswer,
  getQuizResult,
  resetQuiz,
};
