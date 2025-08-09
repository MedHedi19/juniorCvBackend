const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    link: {
        type: String,
        trim: true
    },
    postedTime: {
        type: String,
        trim: true
    },
    source: {
        type: String,
        required: true,
        enum: ['LinkedIn', 'TanitJobs', 'Other']
    },
    description: {
        type: String,
        trim: true
    },
    requirements: [{
        type: String,
        trim: true
    }],
    salary: {
        type: String,
        trim: true
    },
    jobType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'],
        trim: true
    },
    searchTerm: {
        type: String,
        required: true,
        trim: true
    },
    scrapedAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true,
    indexes: [
        { title: 1, company: 1 }, // Unique combination
        { searchTerm: 1 },
        { source: 1 },
        { scrapedAt: -1 }
    ]
});

// Prevent duplicate jobs
jobSchema.index({ title: 1, company: 1 }, { unique: true });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
