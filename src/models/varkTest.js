const mongoose = require('mongoose');

const varkTestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  answers: [
    {
      questionIndex: {
        type: Number,
        required: true,
      },
      selectedStyle: {
        type: String,
        required: true,
        enum: ['V', 'A', 'R', 'K'],
      },
    },
  ],
  styleCounts: {
    V: { type: Number, default: 0 },
    A: { type: Number, default: 0 },
    R: { type: Number, default: 0 },
    K: { type: Number, default: 0 },
  },
  dominantStyle: {
    type: String,
    validate: {
      validator: function (v) {
        return v === null || v === undefined || ['V', 'A', 'R', 'K'].includes(v);
      },
      message: '{VALUE} is not a valid VARK style',
    },
  },
  completedAt: {
    type: Date,
  },
}, { timestamps: true });

// Ensure one VARK test per user
varkTestSchema.index({ userId: 1 }, { unique: true });

const VarkTest = mongoose.model('VarkTest', varkTestSchema);
module.exports = VarkTest;
