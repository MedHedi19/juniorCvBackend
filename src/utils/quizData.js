const fs = require('fs');
const path = require('path');

// Load all quiz files
const loadQuizData = () => {
    const quizzes = [];
    const quizDir = path.join(__dirname, '../data/7P');
    
    // Quiz files should be named: 1-postulation.json, 2-paperasse.json, etc.
    const quizFiles = [
        'q1.json',
        'q2.json',
        'q3.json',
        'q4.json',
        'q5.json',
        'q6.json',
        'q7.json'
    ];

    quizFiles.forEach((filename, index) => {
        try {
            const filePath = path.join(quizDir, filename);
            if (fs.existsSync(filePath)) {
                const rawData = fs.readFileSync(filePath, 'utf8');
                const quizData = JSON.parse(rawData);
                
                // Extract the quiz name (first key in the JSON)
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

const getQuizByIndex = (index) => {
    const quizzes = loadQuizData();
    return quizzes[index] || null;
};

const getPersonalityTest = () => {
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
    getAllQuizNames,
    loadPersonalityTest,
    getPersonalityTest
};
