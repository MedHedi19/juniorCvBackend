const mongoose = require('mongoose');

const upskillingProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    personalityColor: {
        type: String,
        enum: ['rouge', 'jaune', 'vert', 'bleu'],
        required: true
    },
    challenges: [{
        day: {
            type: Number,
            required: true,
            min: 1,
            max: 21
        },
        completed: {
            type: Boolean,
            default: false
        },
        completedAt: {
            type: Date
        },
        notes: {
            type: String,
            default: ''
        }
    }],
    startedAt: {
        type: Date,
        default: Date.now
    },
    lastAccessedDay: {
        type: Number,
        default: 0
    },
    completedAt: {
        type: Date
    },
    currentStreak: {
        type: Number,
        default: 0
    }
}, { 
    timestamps: true 
});

// Ensure one upskilling progress document per user
upskillingProgressSchema.index({ userId: 1 }, { unique: true });

// Virtual for total completed challenges
upskillingProgressSchema.virtual('totalCompleted').get(function() {
    return this.challenges.filter(c => c.completed).length;
});

// Virtual for progress percentage
upskillingProgressSchema.virtual('progressPercentage').get(function() {
    return Math.round((this.totalCompleted / 21) * 100);
});

// Virtual for remaining challenges
upskillingProgressSchema.virtual('remainingChallenges').get(function() {
    return 21 - this.totalCompleted;
});

// Method to check if all challenges are completed
upskillingProgressSchema.methods.isFullyCompleted = function() {
    return this.challenges.filter(c => c.completed).length === 21;
};

// Method to get next uncompleted challenge
upskillingProgressSchema.methods.getNextChallenge = function() {
    const uncompletedChallenge = this.challenges.find(c => !c.completed);
    return uncompletedChallenge ? uncompletedChallenge.day : null;
};

// Ensure virtuals are included in JSON
upskillingProgressSchema.set('toJSON', { virtuals: true });
upskillingProgressSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('UpskillingProgress', upskillingProgressSchema);
