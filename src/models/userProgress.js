const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quizProgress: [{
        quizName: {
            type: String,
            required: true
        },
        completed: {
            type: Boolean,
            default: false
        },
        score: {
            type: Number,
            default: 0
        },
        totalQuestions: {
            type: Number,
            default: 0
        },
        percentage: {
            type: Number,
            default: 0
        },
        completedAt: {
            type: Date
        },
        answers: [{
            questionIndex: Number,
            selectedAnswer: String,
            isCorrect: Boolean
        }]
    }],
    currentQuizIndex: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Ensure one progress document per user
userProgressSchema.index({ userId: 1 }, { unique: true });

const UserProgress = mongoose.model('UserProgress', userProgressSchema);
module.exports = UserProgress;

