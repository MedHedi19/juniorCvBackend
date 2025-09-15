const UserProgress = require('../models/userProgress');
const { getQuizByIndex, getAllQuizNames, getOriginalQuizByIndex } = require('../utils/quizData');

// Get all quizzes with user progress
const getQuizzes = async (req, res) => {
    try {
        const userId = req.user.id;
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
        const userId = req.user.id;
        const lang = req.query.lang || 'fr'; // Default to French

        const quiz = getQuizByIndex(parseInt(quizId, 10), lang);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Check if quiz is unlocked
        const userProgress = await UserProgress.findOne({ userId });
        if (!userProgress) {
            return res.status(400).json({ message: 'User progress not found' });
        }

        if (parseInt(quizId, 10) > userProgress.currentQuizIndex) {
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
        const { quizId, questionIndex } = req.params;
        const { answer } = req.body;
        const userId = req.user.id;
        const lang = req.query.lang || 'fr';

        const quiz = getOriginalQuizByIndex(parseInt(quizId, 10));
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        const question = quiz.questions[questionIndex];
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        // Find the original French answer from the user's translated answer
        const translatedQuiz = getQuizByIndex(parseInt(quizId, 10), lang);
        const translatedQuestion = translatedQuiz.questions[questionIndex];
        const optionIndex = translatedQuestion.options.indexOf(answer);

        if (optionIndex === -1) {
            return res.status(400).json({ message: 'Invalid answer option' });
        }

        const originalAnswer = question.options[optionIndex].fr;
        const isCorrect = originalAnswer === question.correct.fr;

        // Get user progress
        const userProgress = await UserProgress.findOne({ userId });
        if (!userProgress) {
            return res.status(400).json({ message: 'User progress not found' });
        }

        // Find the specific quiz progress
        let quizProgress = userProgress.quizProgress.find(p => p.quizName === quiz.name);
        if (!quizProgress) {
            // Initialize if it doesn't exist (should not happen in normal flow)
            quizProgress = {
                quizName: quiz.name,
                completed: false,
                score: 0,
                totalQuestions: quiz.totalQuestions,
                percentage: 0,
                answers: []
            };
            userProgress.quizProgress.push(quizProgress);
        }

        // Check if answer for this question already exists
        const existingAnswerIndex = quizProgress.answers.findIndex(a => a.questionIndex === parseInt(questionIndex, 10));
        if (existingAnswerIndex !== -1) {
            // Update existing answer
            const wasCorrect = quizProgress.answers[existingAnswerIndex].isCorrect;
            if (wasCorrect && !isCorrect) {
                quizProgress.score -= 1;
            } else if (!wasCorrect && isCorrect) {
                quizProgress.score += 1;
            }
            quizProgress.answers[existingAnswerIndex].answer = originalAnswer;
            quizProgress.answers[existingAnswerIndex].isCorrect = isCorrect;
        } else {
            // Add new answer
            if (isCorrect) {
                quizProgress.score += 1;
            }
            quizProgress.answers.push({
                questionIndex: parseInt(questionIndex, 10),
                question: question.question.fr,
                answer: originalAnswer,
                isCorrect
            });
        }

        // Calculate percentage
        quizProgress.percentage = (quizProgress.score / quiz.totalQuestions) * 100;

        // Check if quiz is completed
        const isQuizCompleted = quizProgress.answers.length === quiz.totalQuestions;
        if (isQuizCompleted && !quizProgress.completed) {
            quizProgress.completed = true;
            quizProgress.completedAt = new Date();
            // Unlock next quiz if this one is completed
            if (userProgress.currentQuizIndex === parseInt(quizId, 10)) {
                userProgress.currentQuizIndex += 1;
            }
        }

        await userProgress.save();

        // Prepare response
        const response = {
            isCorrect,
            score: quizProgress.score,
            totalQuestions: quiz.totalQuestions,
            percentage: quizProgress.percentage,
            completed: quizProgress.completed
        };

        // If quiz is not completed, send next question
        const nextQuestionIndex = parseInt(questionIndex, 10) + 1;
        if (nextQuestionIndex < quiz.totalQuestions) {
            const nextQuestion = getQuizByIndex(parseInt(quizId, 10), lang).questions[nextQuestionIndex];
            response.nextQuestion = {
                questionIndex: nextQuestionIndex,
                question: nextQuestion.question,
                options: nextQuestion.options
            };
        } else {
            // Send final results if quiz is completed
            response.message = 'Quiz completed!';
            response.finalResult = {
                score: quizProgress.score,
                totalQuestions: quiz.totalQuestions,
                percentage: quizProgress.percentage,
                answers: quizProgress.answers
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
        const userId = req.user.id;

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
        const userId = req.user.id;

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
