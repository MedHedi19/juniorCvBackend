// Test email functionality
require('dotenv').config(); // Load environment variables
const { sendWelcomeEmail } = require('../src/utils/emailService');
const fs = require('fs');

// Direct debug function that writes to a file
function debugToFile(message) {
  try {
    fs.appendFileSync('email-debug.log', `[${new Date().toISOString()}] ${message}\n`);
  } catch (err) {
    // Can't do much if this fails
    console.error('Error writing to debug file:', err);
  }
}

console.log('=================== EMAIL TEST SCRIPT ===================');
console.log('Current environment variables:');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '[DEFINED]' : '[NOT DEFINED]');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('==========================================================');

debugToFile('=================== EMAIL TEST SCRIPT ===================');
debugToFile(`EMAIL_USER: ${process.env.EMAIL_USER}`);
debugToFile(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '[DEFINED]' : '[NOT DEFINED]'}`);
debugToFile(`EMAIL_HOST: ${process.env.EMAIL_HOST}`);
debugToFile(`EMAIL_PORT: ${process.env.EMAIL_PORT}`);

// Test recipient - replace with your test email
const testEmail = 'test@example.com'; // Replace with your test email
const testName = 'Test User';

async function runTest() {
  try {
    console.log(`Sending test email to: ${testEmail}`);
    debugToFile(`Sending test email to: ${testEmail}`);
    
    const result = await sendWelcomeEmail(testEmail, testName);
    
    console.log('Email send result:', result);
    debugToFile(`Email send result: ${JSON.stringify(result)}`);
    
    if (result.success) {
      console.log('TEST PASSED: Email sent successfully!');
      debugToFile('TEST PASSED: Email sent successfully!');
    } else {
      console.error('TEST FAILED: Email could not be sent.');
      console.error('Error:', result.error);
      debugToFile('TEST FAILED: Email could not be sent.');
      debugToFile(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('TEST ERROR: Exception during email send test.');
    console.error(error);
    debugToFile('TEST ERROR: Exception during email send test.');
    debugToFile(`Error: ${error.message}`);
    debugToFile(`Stack: ${error.stack}`);
  }
}

// Run the test
runTest().then(() => {
  console.log('Test completed, check email-debug.log for detailed logs');
});
