// Script to install required dependencies for Google auth testing
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Checking and installing required dependencies for Google Auth testing...');

// List of required dependencies
const dependencies = [
  'passport',
  'passport-google-oauth20',
  'open'
];

// Check if package.json exists
const packageJsonPath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('package.json not found');
  process.exit(1);
}

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const installedDependencies = { 
  ...packageJson.dependencies || {}, 
  ...packageJson.devDependencies || {} 
};

// Find missing dependencies
const missingDependencies = dependencies.filter(dep => !installedDependencies[dep]);

// Install missing dependencies
if (missingDependencies.length > 0) {
  console.log(`Installing missing dependencies: ${missingDependencies.join(', ')}`);
  
  try {
    execSync(`npm install ${missingDependencies.join(' ')} --save`, { stdio: 'inherit' });
    console.log('Dependencies installed successfully.');
  } catch (error) {
    console.error('Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('All required dependencies are already installed.');
}

console.log('\nSetup complete! You can now run the Google Auth tests:');
console.log('1. Start your server:         npm start');
console.log('2. Run the test client:        npm run test:client');
console.log('3. Run integration tests:      npm run test:auth');
