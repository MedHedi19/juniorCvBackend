const UserProgress = require('../models/userProgress');
const { getQuizByIndex, getAllQuizNames } = require('../utils/quizData');

// Get all quizzes with user progress
const getQuizzes = async (req, res) => {
    try {
        const userId = req.userId;
        const allQuizzes = getAllQuizNames();
        
        // Get or create user progress
        let userProgress = await UserProgress.findOne({ userId });
        if (!userProgress) {
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

        res.json({
            quizzes: quizzesWithProgress,
            currentQuizIndex: userProgress.currentQuizIndex
        });
    } catch (error) {
        console.error('Error getting quizzes:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Start a quiz (get first question)
const startQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const userId = req.userId;
        
        const quiz = getQuizByIndex(parseInt(quizId));
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Check if quiz is unlocked
        const userProgress = await UserProgress.findOne({ userId });
        if (!userProgress) {
            return res.status(400).json({ message: 'User progress not found' });
        }

        if (parseInt(quizId) > userProgress.currentQuizIndex) {
            return res.status(403).json({ message: 'Quiz is locked. Complete previous quizzes first.' });
        }

        // Return first question without correct answer
        const firstQuestion = {
            questionIndex: 0,
            question: quiz.questions[0].question,
            options: quiz.questions[0].options,
            totalQuestions: quiz.questions.length,
            quizName: quiz.name
        };

        res.json(firstQuestion);
    } catch (error) {
        console.error('Error starting quiz:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Submit answer for a question
const submitAnswer = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { questionIndex, selectedAnswer } = req.body;
        const userId = req.userId;

        const quiz = getQuizByIndex(parseInt(quizId));
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        if (questionIndex >= quiz.questions.length) {
            return res.status(400).json({ message: 'Invalid question index' });
        }

        const currentQuestion = quiz.questions[questionIndex];
        const isCorrect = currentQuestion.correct === selectedAnswer;

        // Update user progress
        let userProgress = await UserProgress.findOne({ userId });
        if (!userProgress) {
            return res.status(400).json({ message: 'User progress not found' });
        }

        // Find or create quiz progress
        let quizProgress = userProgress.quizProgress.find(p => p.quizName === quiz.name);
        if (!quizProgress) {
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

        // Update or add answer
        const existingAnswerIndex = quizProgress.answers.findIndex(a => a.questionIndex === questionIndex);
        if (existingAnswerIndex >= 0) {
            quizProgress.answers[existingAnswerIndex] = {
                questionIndex,
                selectedAnswer,
                isCorrect
            };
        } else {
            quizProgress.answers.push({
                questionIndex,
                selectedAnswer,
                isCorrect
            });
        }

        // Calculate current score
        quizProgress.score = quizProgress.answers.filter(a => a.isCorrect).length;
        quizProgress.percentage = Math.round((quizProgress.score / quiz.questions.length) * 100);

        await userProgress.save();

        // Prepare response
        const response = {
            isCorrect,
            correctAnswer: currentQuestion.correct,
            currentScore: quizProgress.score,
            totalQuestions: quiz.questions.length
        };

        // Check if this is the last question
        if (questionIndex === quiz.questions.length - 1) {
            // Quiz completed
            quizProgress.completed = true;
            quizProgress.completedAt = new Date();
            
            // Unlock next quiz if this one is passed (you can set your own passing criteria)
            if (userProgress.currentQuizIndex === parseInt(quizId)) {//quizProgress.percentage>50
                userProgress.currentQuizIndex = Math.min(userProgress.currentQuizIndex + 1, 6); // Max 6 (0-based indexing)
            }
            
            await userProgress.save();
            
            response.quizCompleted = true;
            response.finalScore = quizProgress.score;
            response.percentage = quizProgress.percentage;
            response.passed = quizProgress.percentage >= 50;
        } else {
            // Return next question
            const nextQuestion = quiz.questions[questionIndex + 1];
            response.nextQuestion = {
                questionIndex: questionIndex + 1,
                question: nextQuestion.question,
                options: nextQuestion.options
            };
        }

        res.json(response);
    } catch (error) {
        console.error('Error submitting answer:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get quiz results
const getQuizResult = async (req, res) => {
    try {
        const { quizId } = req.params;
        const userId = req.userId;

        const quiz = getQuizByIndex(parseInt(quizId));
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        const userProgress = await UserProgress.findOne({ userId });
        if (!userProgress) {
            return res.status(400).json({ message: 'User progress not found' });
        }

        const quizProgress = userProgress.quizProgress.find(p => p.quizName === quiz.name);
        if (!quizProgress || !quizProgress.completed) {
            return res.status(400).json({ message: 'Quiz not completed yet' });
        }

        res.json({
            quizName: quiz.name,
            score: quizProgress.score,
            totalQuestions: quizProgress.totalQuestions,
            percentage: quizProgress.percentage,
            passed: quizProgress.percentage >= 50,
            completedAt: quizProgress.completedAt,
            answers: quizProgress.answers.map((answer, index) => ({
                questionIndex: answer.questionIndex,
                question: quiz.questions[answer.questionIndex].question,
                selectedAnswer: answer.selectedAnswer,
                correctAnswer: quiz.questions[answer.questionIndex].correct,
                isCorrect: answer.isCorrect
            }))
        });
    } catch (error) {
        console.error('Error getting quiz result:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Reset quiz progress (for retaking)
const resetQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const userId = req.userId;

        const quiz = getQuizByIndex(parseInt(quizId));
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        const userProgress = await UserProgress.findOne({ userId });
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
        }

        res.json({ message: 'Quiz reset successfully' });
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
