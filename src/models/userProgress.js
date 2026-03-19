const mongoose = require('mongoose');

const localizedTextSchema = new mongoose.Schema(
  {
    fr: {
      type: String,
    },
    en: {
      type: String,
    },
    ar: {
      type: String,
    },
  },
  { _id: false }
);

const questionSnapshotSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    question: {
      type: localizedTextSchema,
    },
    options: {
      type: [localizedTextSchema],
      default: [],
    },
    correct: {
      type: localizedTextSchema,
    },
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
  {
    questionIndex: Number,
    questionId: mongoose.Schema.Types.ObjectId,
    selectedAnswer: String,
    isCorrect: Boolean,
    questionSnapshot: questionSnapshotSchema,
    answeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quizProgress: [
      {
        moduleId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'QuizModule',
        },
        moduleSlug: {
          type: String,
        },
        moduleVersion: {
          type: Number,
          default: 1,
        },
        quizName: {
          type: String,
          required: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        score: {
          type: Number,
          default: 0,
        },
        totalQuestions: {
          type: Number,
          default: 10,
        },
        percentage: {
          type: Number,
          default: 0,
        },
        completedAt: {
          type: Date,
        },
        selectedQuestions: [
          {
            type: Number,
          },
        ],
        selectedQuestionIds: {
          type: [mongoose.Schema.Types.ObjectId],
          default: [],
        },
        selectedQuestionSnapshots: {
          type: [questionSnapshotSchema],
          default: [],
        },
        answers: {
          type: [answerSchema],
          default: [],
        },
      },
    ],
    currentQuizIndex: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Ensure one progress document per user
userProgressSchema.index({ userId: 1 }, { unique: true });

const UserProgress = mongoose.model('UserProgress', userProgressSchema);
module.exports = UserProgress;
