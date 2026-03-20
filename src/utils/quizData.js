const fs = require('fs');
const path = require('path');

// 7P quiz modules are now sourced from the QuizModule collection in MongoDB.
// These compatibility helpers intentionally return empty values instead of
// reading local files from src/data/7P.
const loadQuizData = () => [];
const getQuizByIndex = () => null;
const getAllQuizNames = () => [];

const loadPersonalityTest = (language = 'fr') => {
  try {
    const filePath = path.join(__dirname, '../data/personality/personality-test.json');
    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath, 'utf8');
      const testData = JSON.parse(rawData);

      const testName = Object.keys(testData)[0];
      const questions = testData[testName].map((question) => ({
        question: question.question[language] || question.question['fr'], // Fallback to French
        options: Object.fromEntries(
          Object.entries(question.options).map(([color, texts]) => [
            color,
            texts[language] || texts['fr'], // Fallback to French
          ])
        ),
      }));

      return {
        id: 'personality',
        name: testName.trim(),
        questions: questions,
        totalQuestions: questions.length,
      };
    }
  } catch (error) {
    console.error('Error loading personality test:', error);
  }
  return null;
};

const getPersonalityTest = (language = 'fr') => {
  return loadPersonalityTest(language);
};

module.exports = {
  loadQuizData,
  getQuizByIndex,
  getAllQuizNames,
  loadPersonalityTest,
  getPersonalityTest,
};
