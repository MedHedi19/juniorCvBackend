const mongoose = require('mongoose');

const personalityTestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    answers: [{
        questionIndex: {
            type: Number,
            required: true
        },
        selectedColor: {
            type: String,
            required: true,
            enum: ['R', 'J', 'B', 'V']
        }
    }],
    colorCounts: {
        R: { type: Number, default: 0 },
        J: { type: Number, default: 0 },
        B: { type: Number, default: 0 },
        V: { type: Number, default: 0 }
    },
    dominantColor: {
        type: String,
        validate: {
            validator: function(v) {
                return v === null || v === undefined || ['R', 'J', 'B', 'V'].includes(v);
            },
            message: '{VALUE} is not a valid color'
        }
    },
    completedAt: {
        type: Date
    }
}, { timestamps: true });

// Ensure one personality test per user
personalityTestSchema.index({ userId: 1 }, { unique: true });

const PersonalityTest = mongoose.model('PersonalityTest', personalityTestSchema);
module.exports = PersonalityTest;





