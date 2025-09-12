// Diagnostic router for testing email functionality
const express = require('express');
const router = express.Router();
const { sendWelcomeEmail } = require('../utils/emailService');
const fs = require('fs');

// Direct debug function that writes to a file
function debugToFile(message) {
  try {
    fs.appendFileSync('diagnostic.log', `[${new Date().toISOString()}] ${message}\n`);
  } catch (err) {
    console.error('Error writing to debug file:', err);
  }
}

// Route to check if emails can be sent
router.post('/test-email', async (req, res) => {
  const { email, firstName } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  
  try {
    debugToFile(`DIAGNOSTIC: test-email endpoint called for ${email}`);
    console.log(`DIAGNOSTIC: test-email endpoint called for ${email}`);
    
    // Try to send the email
    const result = await sendWelcomeEmail(email, firstName || 'Test User');
    
    // Log the result
    debugToFile(`DIAGNOSTIC: Email result - ${JSON.stringify(result)}`);
    console.log(`DIAGNOSTIC: Email result - ${JSON.stringify(result)}`);
    
    return res.status(200).json({
      message: result.success ? 'Email sent successfully' : 'Email sending failed',
      emailSent: result.success,
      details: result
    });
  } catch (error) {
    debugToFile(`DIAGNOSTIC ERROR: ${error.message}`);
    debugToFile(`DIAGNOSTIC STACK: ${error.stack}`);
    console.error('DIAGNOSTIC ERROR:', error);
    
    return res.status(500).json({
      message: 'Error sending test email',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// Route to check environment variables
router.get('/env-check', (req, res) => {
  // Only return non-sensitive info
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    EMAIL_USER: process.env.EMAIL_USER || 'not set',
    EMAIL_HOST: process.env.EMAIL_HOST || 'not set',
    EMAIL_PORT: process.env.EMAIL_PORT || 'not set',
    EMAIL_PASS_SET: process.env.EMAIL_PASS ? true : false,
    EMAIL_PASS_LENGTH: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0
  };
  
  debugToFile(`DIAGNOSTIC: env-check endpoint called, result: ${JSON.stringify(envInfo)}`);
  console.log('DIAGNOSTIC: env-check endpoint called');
  
  return res.status(200).json(envInfo);
});

module.exports = router;
