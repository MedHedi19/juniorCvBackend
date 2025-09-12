// Direct email sending test
require('dotenv').config();
const { sendWelcomeEmail } = require('./src/utils/emailService');
const fs = require('fs');
const path = require('path');

// Direct debug function that writes to a file
function debugToFile(message) {
  try {
    fs.appendFileSync('diagnostic.log', `[${new Date().toISOString()}] ${message}\n`);
  } catch (err) {
    console.error('Error writing to debug file:', err);
  }
}

// Check and log environment variables
debugToFile('=== ENVIRONMENT VARIABLES CHECK ===');
debugToFile(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
debugToFile(`EMAIL_USER: ${process.env.EMAIL_USER || 'not set'}`);
debugToFile(`EMAIL_PASS: ${process.env.EMAIL_PASS ? 'set (length: ' + process.env.EMAIL_PASS.length + ')' : 'not set'}`);
debugToFile(`EMAIL_HOST: ${process.env.EMAIL_HOST || 'not set'}`);
debugToFile(`EMAIL_PORT: ${process.env.EMAIL_PORT || 'not set'}`);

// Monkey patch the original sendWelcomeEmail function to add diagnostic logging
const originalSendWelcomeEmail = sendWelcomeEmail;

const patchedSendWelcomeEmail = async (email, firstName) => {
  debugToFile(`PATCH: sendWelcomeEmail called with email=${email}, firstName=${firstName}`);
  
  try {
    const result = await originalSendWelcomeEmail(email, firstName);
    debugToFile(`PATCH: sendWelcomeEmail result: ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    debugToFile(`PATCH: sendWelcomeEmail ERROR: ${error.message}`);
    debugToFile(`PATCH: Error stack: ${error.stack}`);
    throw error;
  }
};

// Override the original function
require('./src/utils/emailService').sendWelcomeEmail = patchedSendWelcomeEmail;
debugToFile('Patched sendWelcomeEmail function with diagnostics');

console.log('Email service patched with diagnostics. Check diagnostic.log for details.');
