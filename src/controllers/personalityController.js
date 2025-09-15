const PersonalityTest = require('../models/personalityTest');
const { getPersonalityTest, getOriginalPersonalityTest } = require('../utils/quizData');

// Helper function to transform options object to array format
const transformOptionsToArray = (optionsObj) => {
    return Object.entries(optionsObj).map(([color, text]) => ({
        color,
        text
    }));
};

// Start personality test
const startPersonalityTest = async (req, res) => {
    try {
        const userId = req.user.id;
        const lang = req.query.lang || 'fr'; // Default to French
        
        const test = getPersonalityTest(lang);
        if (!test) {
            return res.status(404).json({ message: 'Personality test not found' });
        }

        // Return first question
        const firstQuestion = {
            questionIndex: 0,
            question: test.questions[0].question,
            options: transformOptionsToArray(test.questions[0].options),
            totalQuestions: test.questions.length,
            testName: test.name
        };

        res.json(firstQuestion);
    } catch (error) {
        console.error('Error starting personality test:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Submit answer for personality test
const submitPersonalityAnswer = async (req, res) => {
    try {
        const { questionIndex, selectedColor } = req.body;
        const userId = req.user.id;
        const lang = req.query.lang || 'fr'; // Default to French

        // Get both the translated and original test
        const translatedTest = getPersonalityTest(lang);
        const originalTest = getOriginalPersonalityTest();
        
        if (!translatedTest || !originalTest) {
            return res.status(404).json({ message: 'Personality test not found' });
        }

        if (questionIndex >= translatedTest.questions.length) {
            return res.status(400).json({ message: 'Invalid question index' });
        }

        // Validate color code
        if (!['R', 'J', 'B', 'V'].includes(selectedColor)) {
            return res.status(400).json({ message: 'Invalid color code' });
        }

        // Get or create personality test progress
        let personalityTest = await PersonalityTest.findOne({ userId });
        if (!personalityTest) {
            personalityTest = new PersonalityTest({
                userId,
                completed: false,
                answers: [],
                colorCounts: { R: 0, J: 0, B: 0, V: 0 },
                dominantColor: null
            });
        }

        // Update or add answer
        const existingAnswerIndex = personalityTest.answers.findIndex(a => a.questionIndex === questionIndex);
        if (existingAnswerIndex >= 0) {
            // Remove old color count
            const oldColor = personalityTest.answers[existingAnswerIndex].selectedColor;
            personalityTest.colorCounts[oldColor]--;
            
            // Update answer
            personalityTest.answers[existingAnswerIndex] = {
                questionIndex,
                selectedColor
            };
        } else {
            personalityTest.answers.push({
                questionIndex,
                selectedColor
            });
        }

        // Update color count
        personalityTest.colorCounts[selectedColor]++;

        const response = {
            isCorrect: true,
            questionIndex
        };

        // Check if this is the last question
        if (questionIndex === translatedTest.questions.length - 1) {
            // Test completed
            personalityTest.completed = true;
            personalityTest.completedAt = new Date();
            
            // Calculate dominant color
            const colors = Object.keys(personalityTest.colorCounts);
            personalityTest.dominantColor = colors.reduce((a, b) => 
                personalityTest.colorCounts[a] > personalityTest.colorCounts[b] ? a : b
            );
            
            response.testCompleted = true;
            response.colorCounts = personalityTest.colorCounts;
            response.dominantColor = personalityTest.dominantColor;
        } else {
            // Return next question
            const nextQuestion = translatedTest.questions[questionIndex + 1];
            response.nextQuestion = {
                questionIndex: questionIndex + 1,
                question: nextQuestion.question,
                options: transformOptionsToArray(nextQuestion.options)
            };
        }

        await personalityTest.save();
        res.json(response);
    } catch (error) {
        console.error('Error submitting personality answer:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get personality test result
const getPersonalityResult = async (req, res) => {
    try {
        const userId = req.user.id;
        const lang = req.query.lang || 'fr'; // Default to French

        const personalityTest = await PersonalityTest.findOne({ userId });
        if (!personalityTest) {
            return res.status(404).json({ message: 'No personality test results found' });
        }

        if (!personalityTest.completed) {
            return res.status(400).json({ message: 'Personality test not completed yet' });
        }

        res.json({
            colorCounts: personalityTest.colorCounts,
            dominantColor: personalityTest.dominantColor,
            completedAt: personalityTest.completedAt,
            answers: personalityTest.answers
        });
    } catch (error) {
        console.error('Error getting personality result:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Reset personality test
const resetPersonalityTest = async (req, res) => {
    try {
        const userId = req.user.id;
        const lang = req.query.lang || 'fr'; // Default to French

        const personalityTest = await PersonalityTest.findOne({ userId });
        if (!personalityTest) {
            return res.status(400).json({ message: 'Personality test not found' });
        }

        personalityTest.completed = false;
        personalityTest.answers = [];
        personalityTest.colorCounts = { R: 0, J: 0, B: 0, V: 0 };
        personalityTest.dominantColor = null;
        personalityTest.completedAt = null;

        await personalityTest.save();
        res.json({ message: 'Personality test reset successfully' });
    } catch (error) {
        console.error('Error resetting personality test:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

module.exports = {
    startPersonalityTest,
    submitPersonalityAnswer,
    getPersonalityResult,
    resetPersonalityTest
};
