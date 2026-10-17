// Script to run Google auth tests with special configuration
const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Running Google authentication tests...');
  execSync('npx jest --config=jest.oauth.config.js', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname)
  });
} catch (error) {
  console.error('Test execution failed:', error.message);
  process.exit(1);
}
