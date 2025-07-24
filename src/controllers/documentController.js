const UserDocument = require('../models/userDocument');

// Upload CV PDF
const uploadCvPdf = async (req, res) => {
    try {
        const userId = req.user.id;
        const { data, originalName, size } = req.body;

        if (!data) {
            return res.status(400).json({ message: 'No file data provided' });
        }

        let userDoc = await UserDocument.findOne({ userId });
        if (!userDoc) {
            userDoc = new UserDocument({ userId });
        }

        userDoc.cvPdf = {
            data,
            originalName,
            size,
            uploadedAt: new Date()
        };

        await userDoc.save();
        res.json({ message: 'CV uploaded successfully' });
    } catch (error) {
        console.error('Error uploading CV:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Upload Motivation Letter
const uploadMotivationLetter = async (req, res) => {
    try {
        const userId = req.user.id;
        const { data, originalName, size } = req.body;

        if (!data) {
            return res.status(400).json({ message: 'No file data provided' });
        }

        let userDoc = await UserDocument.findOne({ userId });
        if (!userDoc) {
            userDoc = new UserDocument({ userId });
        }

        userDoc.motivationLetter = {
            data,
            originalName,
            size,
            uploadedAt: new Date()
        };

        await userDoc.save();
        res.json({ message: 'Motivation letter uploaded successfully' });
    } catch (error) {
        console.error('Error uploading motivation letter:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Upload CV Video
const uploadCvVideo = async (req, res) => {
    try {
        const userId = req.user.id;
        const { data, originalName, size } = req.body;

        if (!data) {
            return res.status(400).json({ message: 'No file data provided' });
        }

        let userDoc = await UserDocument.findOne({ userId });
        if (!userDoc) {
            userDoc = new UserDocument({ userId });
        }

        userDoc.cvVideo = {
            data,
            originalName,
            size,
            uploadedAt: new Date()
        };

        await userDoc.save();
        res.json({ message: 'CV video uploaded successfully' });
    } catch (error) {
        console.error('Error uploading CV video:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get user documents
const getUserDocuments = async (req, res) => {
    try {
        const userId = req.user.id;
        const userDoc = await UserDocument.findOne({ userId });
        
        if (!userDoc) {
            return res.json({ cvPdf: null, motivationLetter: null, cvVideo: null });
        }

        res.json({
            cvPdf: userDoc.cvPdf || null,
            motivationLetter: userDoc.motivationLetter || null,
            cvVideo: userDoc.cvVideo || null
        });
    } catch (error) {
        console.error('Error getting documents:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Delete document
const deleteDocument = async (req, res) => {
    try {
        const userId = req.user.id;
        const { documentType } = req.params;

        const userDoc = await UserDocument.findOne({ userId });
        if (!userDoc) {
            return res.status(404).json({ message: 'No documents found' });
        }

        userDoc[documentType] = undefined;
        await userDoc.save();

        res.json({ message: `${documentType} deleted successfully` });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

module.exports = {
    uploadCvPdf,
    uploadMotivationLetter,
    uploadCvVideo,
    getUserDocuments,
    deleteDocument
};
