const QuizModule = require('../models/quizModule');

const MAX_QUESTIONS_PER_ATTEMPT = 10;

const ensureQuizModulesSeeded = async () => {
  const existingCount = await QuizModule.estimatedDocumentCount();
  if (existingCount > 0) {
    return;
  }

  // Runtime is database-only. Seed QuizModule documents via migration/seed tooling.
  throw new Error(
    'No 7P quiz modules found in database. Seed QuizModule documents before calling quiz endpoints.'
  );
};

const getAllQuizModules = async () => {
  await ensureQuizModulesSeeded();
  return QuizModule.find({ isActive: true }).sort({ order: 1 }).lean();
};

const getQuizModuleByOrder = async (order) => {
  await ensureQuizModulesSeeded();
  return QuizModule.findOne({ order, isActive: true }).lean();
};

const createQuestionSnapshot = (question) => ({
  questionId: question._id,
  question: {
    fr: question.question.fr,
    en: question.question.en,
    ar: question.question.ar,
  },
  options: question.options.map((option) => ({
    fr: option.fr,
    en: option.en,
    ar: option.ar,
  })),
  correct: {
    fr: question.correct.fr,
    en: question.correct.en,
    ar: question.correct.ar,
  },
});

const buildQuestionSnapshotsFromIds = (quizModule, questionIds = []) => {
  if (!quizModule || !Array.isArray(quizModule.questions) || !Array.isArray(questionIds)) {
    return [];
  }

  const questionMap = new Map(
    quizModule.questions.map((question) => [String(question._id), question])
  );

  return questionIds
    .map((questionId) => questionMap.get(String(questionId)))
    .filter(Boolean)
    .map((question) => createQuestionSnapshot(question));
};

const buildQuestionSnapshotsFromIndexes = (quizModule, indexes = []) => {
  if (!quizModule || !Array.isArray(quizModule.questions) || !Array.isArray(indexes)) {
    return [];
  }

  const questionsByOrder = new Map(
    quizModule.questions.map((question) => [Number(question.order), question])
  );

  return indexes
    .map((index) => questionsByOrder.get(Number(index)))
    .filter(Boolean)
    .map((question) => createQuestionSnapshot(question));
};

const pickRandomQuestionSnapshots = (quizModule, maxQuestions = MAX_QUESTIONS_PER_ATTEMPT) => {
  if (!quizModule || !Array.isArray(quizModule.questions) || quizModule.questions.length === 0) {
    return [];
  }

  const questionCount = Math.min(maxQuestions, quizModule.questions.length);
  const questionPool = [...quizModule.questions];
  const selectedQuestions = [];

  while (selectedQuestions.length < questionCount && questionPool.length > 0) {
    const randomIndex = Math.floor(Math.random() * questionPool.length);
    const randomQuestion = questionPool.splice(randomIndex, 1)[0];
    selectedQuestions.push(randomQuestion);
  }

  return selectedQuestions.map((question) => createQuestionSnapshot(question));
};

module.exports = {
  MAX_QUESTIONS_PER_ATTEMPT,
  ensureQuizModulesSeeded,
  getAllQuizModules,
  getQuizModuleByOrder,
  buildQuestionSnapshotsFromIds,
  buildQuestionSnapshotsFromIndexes,
  pickRandomQuestionSnapshots,
};
