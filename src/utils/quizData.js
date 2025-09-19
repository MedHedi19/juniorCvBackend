// quizData.js
const fs = require('fs');
const path = require('path');

// Load all quiz files
const loadQuizData = () => {
    console.log('Step: Entering loadQuizData');
    const quizzes = [];
    const quizDir = path.join(__dirname, '../data/7P');
    
    // Quiz files should be named: q1.json, q2.json, etc.
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
        console.log(`Step: Processing quiz file ${filename} (index: ${index})`);
        try {
            const filePath = path.join(quizDir, filename);
            console.log(`Step: Checking if file exists at ${filePath}`);
            if (fs.existsSync(filePath)) {
                console.log(`Step: Reading file ${filename}`);
                const rawData = fs.readFileSync(filePath, 'utf8');
                const quizData = JSON.parse(rawData);
                
                // Extract the quiz name (first key in the JSON)
                const quizName = Object.keys(quizData)[0];
                console.log(`Step: Extracted quiz name: ${quizName}`);
                const questions = quizData[quizName];
                
                // Validate that questions are in the correct multi-language format
                const validatedQuestions = questions.map((q, qIndex) => {
                    console.log(`Step: Validating question ${qIndex} in ${quizName}`);
                    if (!q.question || !q.options || !q.correct) {
                        console.error(`Step: Invalid question structure in ${filename}, question ${qIndex}`);
                        throw new Error(`Invalid question structure in ${filename}`);
                    }
                    if (!q.question.fr || !q.question.en || !q.question.ar) {
                        console.error(`Step: Missing language keys in question ${qIndex} of ${filename}`);
                        throw new Error(`Missing language keys in question ${qIndex}`);
                    }
                    if (!q.options.every(opt => opt.fr && opt.en && opt.ar)) {
                        console.error(`Step: Missing language keys in options for question ${qIndex} of ${filename}`);
                        throw new Error(`Missing language keys in options for question ${qIndex}`);
                    }
                    if (!q.correct.fr || !q.correct.en || !q.correct.ar) {
                        console.error(`Step: Missing language keys in correct answer for question ${qIndex} of ${filename}`);
                        throw new Error(`Missing language keys in correct answer for question ${qIndex}`);
                    }
                    return {
                        question: {
                            fr: q.question.fr,
                            en: q.question.en,
                            ar: q.question.ar
                        },
                        options: q.options.map(opt => ({
                            fr: opt.fr,
                            en: opt.en,
                            ar: opt.ar
                        })),
                        correct: {
                            fr: q.correct.fr,
                            en: q.correct.en,
                            ar: q.correct.ar
                        }
                    };
                });

                quizzes.push({
                    id: index,
                    name: quizName.trim(),
                    questions: validatedQuestions,
                    totalQuestions: validatedQuestions.length
                });
                console.log(`Step: Successfully loaded quiz ${quizName} with ${validatedQuestions.length} questions`);
            } else {
                console.log(`Step: File ${filename} does not exist`);
            }
        } catch (error) {
            console.error(`Error loading quiz file ${filename}:`, error);
        }
    });

    console.log(`Step: Loaded ${quizzes.length} quizzes`);
    return quizzes;
};

// Load personality test (unchanged, as per request)
const loadPersonalityTest = (language = 'fr') => {
    try {
        const filePath = path.join(__dirname, '../data/personality/personality-test.json');
        if (fs.existsSync(filePath)) {
            const rawData = fs.readFileSync(filePath, 'utf8');
            const testData = JSON.parse(rawData);
            
            const testName = Object.keys(testData)[0];
            const questions = testData[testName].map(question => ({
                question: question.question[language] || question.question['fr'], // Fallback to French
                options: Object.fromEntries(
                    Object.entries(question.options).map(([color, texts]) => [
                        color,
                        texts[language] || texts['fr'] // Fallback to French
                    ])
                )
            }));
            
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

const getPersonalityTest = (language = 'fr') => {
    return loadPersonalityTest(language);
};


const getQuizByIndex = (index) => {
    console.log(`Step: Fetching quiz by index ${index}`);
    const quizzes = loadQuizData();
    const quiz = quizzes[index] || null;
    console.log(`Step: Quiz ${index} ${quiz ? 'found' : 'not found'}`);
    return quiz;
};

const getAllQuizNames = () => {
    console.log('Step: Fetching all quiz names');
    const quizzes = loadQuizData();
    const quizNames = quizzes.map(quiz => ({
        id: quiz.id,
        name: quiz.name,
        totalQuestions: quiz.totalQuestions
    }));
    console.log(`Step: Retrieved ${quizNames.length} quiz names`);
    return quizNames;
};

module.exports = {
    loadQuizData,
    getQuizByIndex,
    getAllQuizNames,
    loadPersonalityTest,
    getPersonalityTest
};