// Jest config for testing social authentication
module.exports = {
  roots: ['<rootDir>/__tests__'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/integration/googleAuth.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/db.js',
    '!**/node_modules/**',
  ],
  // Skip the global setup to avoid MongoDB Memory Server
  setupFilesAfterEnv: [],
  // Set a timeout that's higher than the default 5s
  testTimeout: 15000,
  // Mock all node modules in node_modules
  transformIgnorePatterns: ['node_modules/(?!(supertest|express))'],
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
};
