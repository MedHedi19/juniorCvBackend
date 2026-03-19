const fs = require('fs');
const path = require('path');
const QuizModule = require('../models/quizModule');

const QUIZ_DIRECTORY = path.join(__dirname, '../data/7P');
const MAX_QUESTIONS_PER_ATTEMPT = 10;

const extractOrderFromFileName = (fileName) => {
  const match = fileName.match(/q(\d+)\.json/i);
  if (!match) {
    return null;
  }

  return Number.parseInt(match[1], 10) - 1;
};

const assertLocalizedText = (value, context) => {
  if (!value || typeof value !== 'object') {
    throw new Error(`${context} must be a multilingual object`);
  }

  const normalized = {
    fr: typeof value.fr === 'string' ? value.fr.trim() : '',
    en: typeof value.en === 'string' ? value.en.trim() : '',
    ar: typeof value.ar === 'string' ? value.ar.trim() : '',
  };

  if (!normalized.fr || !normalized.en || !normalized.ar) {
    throw new Error(`${context} is missing fr/en/ar values`);
  }

  return normalized;
};

const normalizeQuestion = (question, questionIndex, fileName) => {
  if (!question || typeof question !== 'object') {
    throw new Error(`Invalid question object in ${fileName} at index ${questionIndex}`);
  }

  if (!Array.isArray(question.options) || question.options.length < 2) {
    throw new Error(`Question options are invalid in ${fileName} at index ${questionIndex}`);
  }

  return {
    order: questionIndex,
    question: assertLocalizedText(
      question.question,
      `Question text in ${fileName}#${questionIndex}`
    ),
    options: question.options.map((option, optionIndex) =>
      assertLocalizedText(option, `Option ${optionIndex} in ${fileName}#${questionIndex}`)
    ),
    correct: assertLocalizedText(
      question.correct,
      `Correct answer in ${fileName}#${questionIndex}`
    ),
    isActive: true,
  };
};

const loadLegacyModulesFromFiles = () => {
  if (!fs.existsSync(QUIZ_DIRECTORY)) {
    return [];
  }

  const files = fs
    .readdirSync(QUIZ_DIRECTORY)
    .filter((fileName) => /^q\d+\.json$/i.test(fileName))
    .sort((a, b) => extractOrderFromFileName(a) - extractOrderFromFileName(b));

  return files.map((fileName, fallbackIndex) => {
    const filePath = path.join(QUIZ_DIRECTORY, fileName);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(fileContent);
    const moduleEntry = Object.entries(parsed)[0] || [];
    const [moduleName, questions] = moduleEntry;

    if (!moduleName || !Array.isArray(questions)) {
      throw new Error(`Invalid quiz module format in ${fileName}`);
    }

    const orderFromFile = extractOrderFromFileName(fileName);
    const moduleOrder = Number.isInteger(orderFromFile) ? orderFromFile : fallbackIndex;

    return {
      slug: fileName.replace('.json', '').toLowerCase(),
      order: moduleOrder,
      name: moduleName.trim(),
      version: 1,
      isActive: true,
      questions: questions.map((question, questionIndex) =>
        normalizeQuestion(question, questionIndex, fileName)
      ),
    };
  });
};

const isDuplicateKeyError = (error) => error && (error.code === 11000 || error.code === 11001);

const ensureQuizModulesSeeded = async () => {
  const existingCount = await QuizModule.estimatedDocumentCount();
  if (existingCount > 0) {
    return;
  }

  const modules = loadLegacyModulesFromFiles();
  if (modules.length === 0) {
    throw new Error('No 7P quiz modules found to seed.');
  }

  try {
    await QuizModule.insertMany(modules, { ordered: true });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      // Another request likely seeded at the same time.
      return;
    }
    throw error;
  }
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
