const {
  generateCertificate: generateCertificatePdf,
  generateCertificateImage,
  generateNextReferenceNumber,
} = require('../utils/generateCertificate');
const emailService = require('../utils/emailService');
const User = require('../models/user');

// NEW: Download certificate as base64 - for app to display and share
const downloadCertificate = async (req, res) => {
  try {
    const userId = req.params.userId || (req.user && req.user.id);
    if (!userId)
      return res
        .status(400)
        .json({ success: false, message: 'Missing userId (no param and no authenticated user)' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const fullName = `${user.firstName} ${user.lastName}`.trim();

    // Generate or retrieve reference number
    let referenceNumber = user.certificateReference;
    if (!referenceNumber) {
      // Get the last reference number from the database
      const lastUser = await User.findOne({ certificateReference: { $ne: null } })
        .sort({ certificateReference: -1 })
        .select('certificateReference');
      const lastReference = lastUser ? lastUser.certificateReference : null;
      referenceNumber = generateNextReferenceNumber(lastReference);

      // Save reference to user (use updateOne to avoid pre-save hook)
      await User.updateOne(
        { _id: user._id },
        { certificateReference: referenceNumber }
      );
    }

    // Generate PDF buffer with reference number
    const pdfBuffer = await generateCertificatePdf(fullName, referenceNumber);

    // Convert to base64 for frontend
    const pdfBase64 = pdfBuffer.toString('base64');

    return res.json({
      success: true,
      pdfBase64: pdfBase64,
      fileName: `JuniorsCV-Certificate-${user.firstName}-${user.lastName}.pdf`,
      userName: fullName,
      referenceNumber: referenceNumber,
    });
  } catch (err) {
    console.error('downloadCertificate error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error', error: err.message });
  }
};

// NEW: Download certificate as PNG image - for social media sharing
const downloadCertificateImage = async (req, res) => {
  try {
    const userId = req.params.userId || (req.user && req.user.id);
    if (!userId)
      return res
        .status(400)
        .json({ success: false, message: 'Missing userId (no param and no authenticated user)' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const fullName = `${user.firstName} ${user.lastName}`.trim();

    // Generate or retrieve reference number
    let referenceNumber = user.certificateReference;
    if (!referenceNumber) {
      const lastUser = await User.findOne({ certificateReference: { $ne: null } })
        .sort({ certificateReference: -1 })
        .select('certificateReference');
      const lastReference = lastUser ? lastUser.certificateReference : null;
      referenceNumber = generateNextReferenceNumber(lastReference);

      await User.updateOne(
        { _id: user._id },
        { certificateReference: referenceNumber }
      );
    }

    // Generate PNG image buffer with reference number
    const imageBuffer = await generateCertificateImage(fullName, referenceNumber);

    // Convert to base64 for frontend
    const imageBase64 = imageBuffer.toString('base64');

    return res.json({
      success: true,
      imageBase64: imageBase64,
      fileName: `JuniorsCV-Certificate-${user.firstName}-${user.lastName}.png`,
      userName: fullName,
      referenceNumber: referenceNumber,
    });
  } catch (err) {
    console.error('downloadCertificateImage error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error', error: err.message });
  }
};

// MODIFIED: Now sends certificate via email (kept as optional feature)
const sendCertificateByEmail = async (req, res) => {
  try {
    const userId = req.params.userId || (req.user && req.user.id);
    if (!userId)
      return res
        .status(400)
        .json({ success: false, message: 'Missing userId (no param and no authenticated user)' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const fullName = `${user.firstName} ${user.lastName}`.trim();

    // Generate or retrieve reference number
    let referenceNumber = user.certificateReference;
    if (!referenceNumber) {
      const lastUser = await User.findOne({ certificateReference: { $ne: null } })
        .sort({ certificateReference: -1 })
        .select('certificateReference');
      const lastReference = lastUser ? lastUser.certificateReference : null;
      referenceNumber = generateNextReferenceNumber(lastReference);

      await User.updateOne(
        { _id: user._id },
        { certificateReference: referenceNumber }
      );
    }

    // Generate PDF buffer with reference number
    const pdfBuffer = await generateCertificatePdf(fullName, referenceNumber);

    // Send email with attachment
    const emailResult = await emailService.sendCertificateEmail(
      user.email,
      user.firstName || fullName,
      pdfBuffer
    );
    if (!emailResult || !emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send certificate email',
        error: emailResult?.error,
      });
    }

    // Increment counter
    await User.updateOne(
      { _id: user._id },
      { $inc: { certificateSentCount: 1 } }
    );

    return res.json({
      success: true,
      message: 'Certificate sent via email',
      messageId: emailResult.messageId,
      referenceNumber: referenceNumber,
    });
  } catch (err) {
    console.error('sendCertificateByEmail error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error', error: err.message });
  }
};

// LEGACY: Keep old name for backward compatibility
const generateCertificate = sendCertificateByEmail;
const generateCertificate_21 = async (req, res) => {
  try {
    const userId = req.params.userId || (req.user && req.user.id);
    if (!userId)
      return res
        .status(400)
        .json({ success: false, message: 'Missing userId (no param and no authenticated user)' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const fullName = `${user.firstName} ${user.lastName}`.trim();

    // Generate or retrieve reference number
    let referenceNumber = user.certificateReference;
    if (!referenceNumber) {
      const lastUser = await User.findOne({ certificateReference: { $ne: null } })
        .sort({ certificateReference: -1 })
        .select('certificateReference');
      const lastReference = lastUser ? lastUser.certificateReference : null;
      referenceNumber = generateNextReferenceNumber(lastReference);

      await User.updateOne(
        { _id: user._id },
        { certificateReference: referenceNumber }
      );
    }

    // Generate PDF buffer with reference number
    const pdfBuffer = await generateCertificatePdf(fullName, referenceNumber);

    // Send email with attachment
    const emailResult = await emailService.sendCertificateEmail_21(
      user.email,
      user.firstName || fullName,
      pdfBuffer
    );
    if (!emailResult || !emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send certificate email',
        error: emailResult?.error,
      });
    }

    // Increment counter
    await User.updateOne(
      { _id: user._id },
      { $inc: { certificateSentCount: 1 } }
    );

    return res.json({
      success: true,
      message: 'Certificate sent via email',
      messageId: emailResult.messageId,
      referenceNumber: referenceNumber,
    });
  } catch (err) {
    console.error('generate21DaysCertificate error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error', error: err.message });
  }
};

// NEW: Download 21-days certificate as base64
const download21DaysCertificate = async (req, res) => {
  try {
    const userId = req.params.userId || (req.user && req.user.id);
    if (!userId)
      return res
        .status(400)
        .json({ success: false, message: 'Missing userId (no param and no authenticated user)' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const fullName = `${user.firstName} ${user.lastName}`.trim();

    // Generate or retrieve reference number
    let referenceNumber = user.certificateReference;
    if (!referenceNumber) {
      const lastUser = await User.findOne({ certificateReference: { $ne: null } })
        .sort({ certificateReference: -1 })
        .select('certificateReference');
      const lastReference = lastUser ? lastUser.certificateReference : null;
      referenceNumber = generateNextReferenceNumber(lastReference);

      await User.updateOne(
        { _id: user._id },
        { certificateReference: referenceNumber }
      );
    }

    // Generate PDF buffer with reference number
    const pdfBuffer = await generateCertificatePdf(fullName, referenceNumber);

    // Convert to base64 for frontend
    const pdfBase64 = pdfBuffer.toString('base64');

    return res.json({
      success: true,
      pdfBase64: pdfBase64,
      fileName: `JuniorsCV-21Days-Certificate-${user.firstName}-${user.lastName}.pdf`,
      userName: fullName,
      referenceNumber: referenceNumber,
    });
  } catch (err) {
    console.error('download21DaysCertificate error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error', error: err.message });
  }
};

const getCertificateSentCount = async (req, res) => {
  try {
    const userId = req.params.userId || (req.user && req.user.id);
    if (!userId)
      return res
        .status(400)
        .json({ success: false, message: 'Missing userId (no param and no authenticated user)' });

    const user = await User.findById(userId).select(
      'certificateSentCount firstName lastName email'
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.json({ success: true, certificateSentCount: user.certificateSentCount || 0 });
  } catch (err) {
    console.error('getCertificateSentCount error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error', error: err.message });
  }
};

module.exports = {
  downloadCertificate, // NEW: Returns PDF as base64 for app display/sharing
  downloadCertificateImage, // NEW: Returns PNG image as base64 for social media
  download21DaysCertificate, // NEW: Returns 21-days PDF as base64
  sendCertificateByEmail, // Send certificate via email (optional)
  generateCertificate, // Legacy - alias for sendCertificateByEmail
  generateCertificate_21, // Legacy - send 21-days cert via email
  getCertificateSentCount,
};
