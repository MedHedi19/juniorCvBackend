const fs = require('fs');
const path = require('path');

// Load all quiz files with language support
const loadQuizData = (language = 'fr') => {
    const quizzes = [];
    const supportedLanguages = ['fr', 'en', 'ar'];
    // Default to French if unsupported language is requested
    const lang = supportedLanguages.includes(language) ? language : 'fr';
    
    // Base directory for quizzes
    const baseQuizDir = path.join(__dirname, '../data/7P');
    
    // Language-specific directory (use base directory for French)
    const quizDir = lang === 'fr' ? baseQuizDir : path.join(baseQuizDir, lang);
    
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
        try {
            // First try language-specific file
            let filePath = path.join(quizDir, filename);
            
            // If language-specific file doesn't exist or we're using French (base),
            // use the default French version
            if (!fs.existsSync(filePath) || lang === 'fr') {
                filePath = path.join(baseQuizDir, filename);
            }
            
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
                    totalQuestions: questions.length,
                    language: lang
                });
            }
        } catch (error) {
            console.error(`Error loading quiz file ${filename} for language ${lang}:`, error);
        }
    });

    return quizzes;
};

// Load personality test with language support
const loadPersonalityTest = (language = 'fr') => {
    const supportedLanguages = ['fr', 'en', 'ar'];
    // Default to French if unsupported language is requested
    const lang = supportedLanguages.includes(language) ? language : 'fr';
    
    try {
        // Base directory for personality test
        const baseDir = path.join(__dirname, '../data/personality');
        
        // Language-specific directory (use base directory for French)
        const langDir = lang === 'fr' ? baseDir : path.join(baseDir, lang);
        
        // First try language-specific file
        let filePath = path.join(langDir, 'personality-test.json');
        
        // If language-specific file doesn't exist or we're using French (base),
        // use the default French version
        if (!fs.existsSync(filePath) || lang === 'fr') {
            filePath = path.join(baseDir, 'personality-test.json');
        }
        
        if (fs.existsSync(filePath)) {
            const rawData = fs.readFileSync(filePath, 'utf8');
            const testData = JSON.parse(rawData);
            
            const testName = Object.keys(testData)[0];
            const questions = testData[testName];
            
            return {
                id: 'personality',
                name: testName.trim(),
                questions: questions,
                totalQuestions: questions.length,
                language: lang
            };
        }
    } catch (error) {
        console.error(`Error loading personality test for language ${lang}:`, error);
    }
    return null;
};

const getQuizByIndex = (index, language = 'fr') => {
    const quizzes = loadQuizData(language);
    return quizzes[index] || null;
};

const getPersonalityTest = (language = 'fr') => {
    return loadPersonalityTest(language);
};

const getAllQuizNames = (language = 'fr') => {
    const quizzes = loadQuizData(language);
    return quizzes.map(quiz => ({
        id: quiz.id,
        name: quiz.name,
        totalQuestions: quiz.totalQuestions,
        language: quiz.language
    }));
};

module.exports = {
    loadQuizData,
    getQuizByIndex,
    getAllQuizNames,
    loadPersonalityTest,
    getPersonalityTest
};
