const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    // Store job details at time of application in case job gets deleted
    jobSnapshot: {
        title: {
            type: String,
            required: true
        },
        company: {
            type: String,
            required: true
        },
        location: String,
        link: String,
        source: String,
        description: String,
        salary: String,
        jobType: String
    },
    status: {
        type: String,
        enum: ['applied', 'viewed', 'interview_scheduled', 'interview_completed', 'rejected', 'accepted', 'withdrawn'],
        default: 'applied'
    },
    appliedAt: {
        type: Date,
        default: Date.now
    },
    lastStatusUpdate: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true
    },
    // Track application method
    applicationMethod: {
        type: String,
        enum: ['direct_link', 'email', 'platform', 'other'],
        default: 'direct_link'
    },
    // Optional: store cover letter or additional documents
    coverLetter: {
        type: String,
        trim: true
    },
    // Track follow-up actions
    followUpReminder: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true,
    indexes: [
        { userId: 1, appliedAt: -1 },
        { userId: 1, status: 1 },
        { jobId: 1 },
        { appliedAt: -1 }
    ]
});

// Prevent duplicate applications for same job by same user
jobApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

// Virtual for application age
jobApplicationSchema.virtual('applicationAge').get(function() {
    return Math.floor((Date.now() - this.appliedAt) / (1000 * 60 * 60 * 24)); // days
});

// Update lastStatusUpdate when status changes
jobApplicationSchema.pre('save', function(next) {
    if (this.isModified('status')) {
        this.lastStatusUpdate = new Date();
    }
    next();
});

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

module.exports = JobApplication;
