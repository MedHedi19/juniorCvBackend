const mongoose = require('mongoose');

const localizedTextSchema = new mongoose.Schema(
  {
    fr: {
      type: String,
      required: true,
      trim: true,
    },
    en: {
      type: String,
      required: true,
      trim: true,
    },
    ar: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const quizQuestionSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      required: true,
    },
    question: {
      type: localizedTextSchema,
      required: true,
    },
    options: {
      type: [localizedTextSchema],
      required: true,
      validate: {
        validator: (options) => Array.isArray(options) && options.length >= 2,
        message: 'Each question must include at least two options.',
      },
    },
    correct: {
      type: localizedTextSchema,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: false }
);

const quizModuleSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: Number,
      min: 1,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    questions: {
      type: [quizQuestionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

quizModuleSchema.index({ isActive: 1, order: 1 });

const QuizModule = mongoose.model('QuizModule', quizModuleSchema);

module.exports = QuizModule;
