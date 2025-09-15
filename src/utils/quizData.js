const fs = require('fs');
const path = require('path');

// Helper to translate a quiz object
const translateQuiz = (quiz, lang = 'fr') => {
    if (!quiz) return null;

    const translatedQuestions = quiz.questions.map(q => {
        const translatedQuestion = {
            question: q.question[lang] || q.question.fr,
            options: q.options.map(opt => opt[lang] || opt.fr),
            correct: q.correct[lang] || q.correct.fr
        };
        return translatedQuestion;
    });

    return {
        ...quiz,
        questions: translatedQuestions
    };
};

// Load all quiz files with original multilingual data
const loadQuizData = () => {
    const quizzes = [];
    const quizDir = path.join(__dirname, '../data/7P');
    
    const quizFiles = [
        'q1.json', 'q2.json', 'q3.json', 'q4.json', 'q5.json', 'q6.json', 'q7.json'
    ];

    quizFiles.forEach((filename, index) => {
        try {
            const filePath = path.join(quizDir, filename);
            if (fs.existsSync(filePath)) {
                const rawData = fs.readFileSync(filePath, 'utf8');
                const quizData = JSON.parse(rawData);
                
                const quizName = Object.keys(quizData)[0];
                const questions = quizData[quizName];
                
                quizzes.push({
                    id: index,
                    name: quizName.trim(),
                    questions: questions,
                    totalQuestions: questions.length
                });
            }
        } catch (error) {
            console.error(`Error loading quiz file ${filename}:`, error);
        }
    });

    return quizzes;
};

// Load personality test
const loadPersonalityTest = () => {
    try {
        // First try to load the translated version
        const translatedFilePath = path.join(__dirname, '../data/personality/personality-test-translated.json');
        if (fs.existsSync(translatedFilePath)) {
            const rawData = fs.readFileSync(translatedFilePath, 'utf8');
            const testData = JSON.parse(rawData);
            
            const testName = Object.keys(testData)[0];
            const questions = testData[testName];
            
            return {
                id: 'personality',
                name: testName.trim(),
                questions: questions,
                totalQuestions: questions.length
            };
        }
        
        // Fall back to the original version if translated doesn't exist
        const filePath = path.join(__dirname, '../data/personality/personality-test.json');
        if (fs.existsSync(filePath)) {
            const rawData = fs.readFileSync(filePath, 'utf8');
            const testData = JSON.parse(rawData);
            
            const testName = Object.keys(testData)[0];
            const questions = testData[testName];
            
            return {
                id: 'personality',
                name: testName.trim(),
                questions: questions,
                totalQuestions: questions.length
            };
        }
    } catch (error) {
        console.error('Error loading personality test:', error);
    }
    return null;
};

const getQuizByIndex = (index, lang = 'fr') => {
    const quizzes = loadQuizData();
    const originalQuiz = quizzes[index] || null;
    return translateQuiz(originalQuiz, lang);
};

// New function to get the original, untranslated quiz data
const getOriginalQuizByIndex = (index) => {
    const quizzes = loadQuizData();
    return quizzes[index] || null;
};

// Helper to translate a personality test object
const translatePersonalityTest = (test, lang = 'fr') => {
    if (!test) return null;

    const translatedQuestions = test.questions.map(q => {
        // Handle both old format (string) and new format (object with language keys)
        const questionText = typeof q.question === 'object' 
            ? (q.question[lang] || q.question.fr) 
            : q.question;

        // Create a translated options object with the same color keys
        const translatedOptions = {};
        Object.keys(q.options).forEach(colorKey => {
            const option = q.options[colorKey];
            translatedOptions[colorKey] = typeof option === 'object'
                ? (option[lang] || option.fr)
                : option;
        });

        return {
            question: questionText,
            options: translatedOptions
        };
    });

    return {
        ...test,
        questions: translatedQuestions
    };
};

const getPersonalityTest = (lang = 'fr') => {
    const test = loadPersonalityTest();
    return translatePersonalityTest(test, lang);
};

// Get the original untranslated personality test (for validation)
const getOriginalPersonalityTest = () => {
    return loadPersonalityTest();
};

const getAllQuizNames = () => {
    const quizzes = loadQuizData();
    return quizzes.map(quiz => ({
        id: quiz.id,
        name: quiz.name,
        totalQuestions: quiz.totalQuestions
    }));
};

module.exports = {
    loadQuizData,
    getQuizByIndex,
    getOriginalQuizByIndex,
    getAllQuizNames,
    loadPersonalityTest,
    getPersonalityTest,
    getOriginalPersonalityTest,
    translatePersonalityTest
};
