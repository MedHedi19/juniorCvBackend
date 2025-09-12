// Middleware to log all registration activity
const fs = require('fs');
const path = require('path');

// Ensure the logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const registrationLogFile = path.join(logsDir, 'registration.log');

function logRegistration(req, res, next) {
  // Only apply to the registration endpoint
  if (req.originalUrl.includes('/auth/register') && req.method === 'POST') {
    const timestamp = new Date().toISOString();
    const { email, firstName, lastName, phone } = req.body;
    
    // Save sensitive info
    const logEntry = `[${timestamp}] REGISTRATION ATTEMPT - Email: ${email}, Name: ${firstName} ${lastName}, Phone: ${phone}\n`;
    
    // Log to file
    fs.appendFile(registrationLogFile, logEntry, (err) => {
      if (err) console.error('Error writing to registration log:', err);
    });
    
    // Create response interceptor to log the result
    const originalSend = res.send;
    res.send = function(body) {
      const responseBody = body instanceof Buffer ? body.toString() : body;
      let parsedBody;
      try {
        parsedBody = JSON.parse(responseBody);
      } catch (e) {
        parsedBody = { raw: responseBody };
      }
      
      const resultLogEntry = `[${timestamp}] REGISTRATION RESULT - Email: ${email}, Status: ${res.statusCode}, Success: ${res.statusCode === 201 ? 'true' : 'false'}, EmailSent: ${parsedBody.emailSent || 'unknown'}\n`;
      
      fs.appendFile(registrationLogFile, resultLogEntry, (err) => {
        if (err) console.error('Error writing registration result to log:', err);
      });
      
      originalSend.call(this, body);
    };
  }
  next();
}

module.exports = logRegistration;
