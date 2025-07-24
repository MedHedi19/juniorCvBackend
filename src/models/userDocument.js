const mongoose = require('mongoose');

const userDocumentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cvPdf: {
        data: String, // Base64 encoded data
        originalName: String,
        size: Number,
        uploadedAt: Date
    },
    motivationLetter: {
        data: String, // Base64 encoded data
        originalName: String,
        size: Number,
        uploadedAt: Date
    },
    cvVideo: {
        data: String, // Base64 encoded data
        originalName: String,
        size: Number,
        uploadedAt: Date
    }
}, { timestamps: true });

// Ensure one document record per user
userDocumentSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('UserDocument', userDocumentSchema);
