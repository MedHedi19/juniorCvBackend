// test-google-auth.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const open = require('open');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3030;

// The URL of your backend server - use the same port as defined in your .env file
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;

// Check for required dependencies
const checkDependencies = () => {
  try {
    // Check if package.json exists
    const packageJsonPath = path.join(__dirname, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.error('package.json not found');
      return false;
    }
    
    const requiredDependencies = ['passport', 'passport-google-oauth20', 'open'];
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const missing = requiredDependencies.filter(dep => !dependencies[dep]);
    
    if (missing.length > 0) {
      console.warn(`Missing dependencies: ${missing.join(', ')}`);
      console.log('Installing missing dependencies...');
      
      try {
        execSync(`npm install ${missing.join(' ')} --save`, { stdio: 'inherit' });
        console.log('Dependencies installed successfully.');
      } catch (error) {
        console.error('Failed to install dependencies:', error.message);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking dependencies:', error.message);
    return false;
  }
};

// Check for required environment variables
const checkEnvironmentVariables = () => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const mobileAppUrl = process.env.MOBILE_APP_URL;
  const baseUrl = process.env.BASE_URL;
  
  let missing = [];
  if (!googleClientId) missing.push('GOOGLE_CLIENT_ID');
  if (!googleClientSecret) missing.push('GOOGLE_CLIENT_SECRET');
  if (!mobileAppUrl) missing.push('MOBILE_APP_URL');
  if (!baseUrl) missing.push('BASE_URL');
  
  if (missing.length > 0) {
    console.warn('\n⚠️ Required environment variables not found:');
    missing.forEach(m => console.warn(`- ${m}`));
    console.warn('Please make sure to set these variables in your .env file');
    console.warn('See GOOGLE_AUTH_SETUP.md for instructions');
    return { configured: false, missing };
  }
  
  return { configured: true, missing: [] };
};

// Run checks
checkDependencies();
const envCheck = checkEnvironmentVariables();

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Google Auth Test</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        button { padding: 10px 20px; background-color: #4285F4; color: white; border: none; border-radius: 4px; cursor: pointer; }
        pre { background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow: auto; }
        .warning { background-color: #fff3cd; color: #856404; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
        .info { background-color: #d1ecf1; color: #0c5460; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>Google Authentication Test Client</h1>
      <p>This page helps test Google authentication in your JuniorCV application.</p>
      
      ${!envCheck.configured ? `
      <div class="warning">
        <strong>Warning:</strong> Required environment variables not configured!<br>
        Missing: ${envCheck.missing.join(', ')}<br>
        Please set these in your .env file.<br>
        See GOOGLE_AUTH_SETUP.md for instructions.
      </div>
      ` : ''}
      
      <div class="info">
        <strong>Environment Check:</strong><br>
        Backend URL: ${BACKEND_URL}<br>
        Mobile App URL: ${process.env.MOBILE_APP_URL || 'Not set'}<br>
        Google Auth: ${process.env.GOOGLE_CLIENT_ID ? 'Configured ✓' : 'Not configured ✗'}<br>
      </div>
      
      <h2>Test Authentication Flow</h2>
      <button onclick="window.location.href='${BACKEND_URL}/auth/google'">Login with Google</button>
      
      <h2>How it works:</h2>
      <ol>
        <li>Clicking the button will redirect you to Google's login page</li>
        <li>After successful login, Google will redirect to your callback URL</li>
        <li>Your app should then redirect back to your app with the token</li>
      </ol>
      
      <h2>API Endpoints:</h2>
      <pre>
Google Login:         GET ${BACKEND_URL}/auth/google
Google Callback:      GET ${BACKEND_URL}/auth/google/callback
Health Check:         GET ${BACKEND_URL}/api/health
      </pre>
      
      <h2>Check Server Status</h2>
      <button id="checkServer">Check Server Status</button>
      <div id="serverStatus"></div>
      
      <script>
        document.getElementById('checkServer').addEventListener('click', async () => {
          const statusDiv = document.getElementById('serverStatus');
          statusDiv.innerHTML = 'Checking server status...';
          
          try {
            const response = await fetch('${BACKEND_URL}/api/health');
            const data = await response.json();
            statusDiv.innerHTML = \`<pre>Server status: \${JSON.stringify(data, null, 2)}</pre>\`;
          } catch (error) {
            statusDiv.innerHTML = \`<pre style="color: red">Error connecting to server: \${error.message}</pre>\`;
          }
        });
      </script>
    </body>
    </html>
  `);
});

const { exec } = require('child_process');

app.listen(PORT, () => {
  console.log(`\n🚀 Test client running at http://localhost:${PORT}`);
  console.log(`📡 Will connect to backend at: ${BACKEND_URL}`);
  console.log('🌐 Opening browser...\n');
  
  // Try to open the browser using the appropriate command for the platform
  const url = `http://localhost:${PORT}`;
  const platform = process.platform;
  
  try {
    let command;
    if (platform === 'win32') {
      command = `start ${url}`;
    } else if (platform === 'darwin') { // macOS
      command = `open ${url}`;
    } else { // Linux and others
      command = `xdg-open ${url}`;
    }
    
    exec(command, (error) => {
      if (error) {
        console.error('Failed to open browser automatically.');
        console.log(`Please open your browser and navigate to: http://localhost:${PORT}`);
      }
    });
  } catch (error) {
    console.error('Failed to open browser automatically.');
    console.log(`Please open your browser and navigate to: http://localhost:${PORT}`);
  }
});
