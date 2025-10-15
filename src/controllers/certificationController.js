const { generateCertificate: generateCertificatePdf } = require('../utils/generateCertificate');
const emailService = require('../utils/emailService');
const User = require('../models/user');

const generateCertificate = async (req, res) => {
    try {
        // Prefer explicit userId param (admin/dev use), otherwise fall back to authenticated user id
        const userId = req.params.userId || (req.user && req.user.id);
        if (!userId) return res.status(400).json({ success: false, message: 'Missing userId (no param and no authenticated user)' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const fullName = `${user.firstName} ${user.lastName}`.trim();
        // generate PDF buffer
        const pdfBuffer = await generateCertificatePdf(fullName);

        // send email with attachment
        const emailResult = await emailService.sendCertificateEmail(user.email, user.firstName || fullName, pdfBuffer);
        if (!emailResult || !emailResult.success) {
            return res.status(500).json({ success: false, message: 'Failed to send certificate email', error: emailResult?.error });
        }

        // increment counter
        user.certificateSentCount = (user.certificateSentCount || 0) + 1;
        await user.save();

        return res.json({ success: true, message: 'Certificate sent', messageId: emailResult.messageId });
    } catch (err) {
        console.error('generateCertificate error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
};

const getCertificateSentCount = async (req, res) => {
    try {
        const userId = req.params.userId || (req.user && req.user.id);
        if (!userId) return res.status(400).json({ success: false, message: 'Missing userId (no param and no authenticated user)' });

        const user = await User.findById(userId).select('certificateSentCount firstName lastName email');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        return res.json({ success: true, certificateSentCount: user.certificateSentCount || 0 });
    } catch (err) {
        console.error('getCertificateSentCount error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
};

module.exports = {
    generateCertificate,
    getCertificateSentCount
};
