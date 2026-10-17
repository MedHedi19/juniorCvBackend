// Welcome Email Test Script
require('dotenv').config();
const fs = require('fs');
const { sendWelcomeEmail } = require('../src/utils/emailService');

// Debug to file function
function logToFile(message) {
  try {
    fs.appendFileSync('email-test-results.log', `[${new Date().toISOString()}] ${message}\n`);
  } catch (err) {
    console.error('Error writing to log file:', err);
  }
}

// Log environment variables
console.log('======== EMAIL TEST ENVIRONMENT ========');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '[DEFINED]' : '[NOT DEFINED]');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('=======================================');

logToFile('======== EMAIL TEST ENVIRONMENT ========');
logToFile(`EMAIL_USER: ${process.env.EMAIL_USER}`);
logToFile(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '[DEFINED]' : '[NOT DEFINED]'}`);
logToFile(`EMAIL_HOST: ${process.env.EMAIL_HOST}`);
logToFile(`EMAIL_PORT: ${process.env.EMAIL_PORT}`);

// Test with your real email address
const testEmail = 'bensalahmedhedi42@gmail.com'; // REPLACE WITH YOUR EMAIL
const testName = 'Test User';

async function runWelcomeEmailTest() {
  console.log(`Sending welcome email to: ${testEmail}`);
  logToFile(`Sending welcome email to: ${testEmail}`);
  
  try {
    const result = await sendWelcomeEmail(testEmail, testName);
    
    console.log('Email result:', result);
    logToFile(`Email result: ${JSON.stringify(result)}`);
    
    if (result.success) {
      console.log('SUCCESS: Welcome email sent successfully!');
      logToFile('SUCCESS: Welcome email sent successfully!');
    } else {
      console.error('FAILED: Welcome email could not be sent');
      console.error('Error:', result.error);
      logToFile('FAILED: Welcome email could not be sent');
      logToFile(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('EXCEPTION: Error during welcome email test');
    console.error(error);
    logToFile('EXCEPTION: Error during welcome email test');
    logToFile(`Error: ${error.message}`);
    logToFile(`Stack: ${error.stack}`);
  }
}

// Run the test
runWelcomeEmailTest().then(() => {
  console.log('Test completed, check email-test-results.log for logs');
});
