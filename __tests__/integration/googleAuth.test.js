const request = require('supertest');

// Mock MongoDB connection to prevent actual database operations
jest.mock('mongoose', () => {
  const mongoose = jest.requireActual('mongoose');
  return {
    ...mongoose,
    connect: jest.fn().mockResolvedValue(mongoose),
  };
});

// Mock the User model to avoid database interactions
jest.mock('../../src/models/user', () => {
  const mockUser = {
    _id: 'mock-user-id',
    firstName: 'Test',
    lastName: 'User',
    email: 'testuser@gmail.com',
    profilePhoto: 'https://example.com/photo.jpg',
    refreshToken: 'mock-refresh-token',
    save: jest.fn().mockResolvedValue(true)
  };

  return {
    findOne: jest.fn().mockResolvedValue(mockUser),
    findById: jest.fn().mockResolvedValue(mockUser),
    mockUser: mockUser
  };
});

// Mock token utilities
jest.mock('../../src/utils/token', () => ({
  generateTokens: jest.fn().mockReturnValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token'
  }),
  verifyRefreshToken: jest.fn().mockReturnValue({ id: 'mock-user-id' })
}));

// Mock email service
jest.mock('../../src/utils/emailService', () => ({
  sendSocialWelcomeEmail: jest.fn().mockResolvedValue({ success: true })
}));

// Mock passport and its strategies
jest.mock('passport', () => {
  return {
    initialize: jest.fn().mockReturnValue((req, res, next) => next()),
    authenticate: jest.fn().mockImplementation(() => (req, res, next) => {
      req.user = {
        _id: 'mock-user-id',
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@gmail.com',
        profilePhoto: 'https://example.com/photo.jpg',
        save: jest.fn().mockResolvedValue(true)
      };
      req.isNewUser = true;
      req.provider = 'google';
      next();
    }),
    use: jest.fn()
  };
});

// Mock the passport config to avoid the actual OAuth setup
jest.mock('../../src/config/passport', () => {
  return jest.fn().mockImplementation((app) => {
    // This is a no-op function that doesn't actually initialize passport
    return null;
  });
});

// Mock the passport strategies
jest.mock('passport-google-oauth20', () => ({
  Strategy: jest.fn()
}));

jest.mock('passport-facebook', () => ({
  Strategy: jest.fn()
}));

jest.mock('passport-linkedin-oauth2', () => ({
  Strategy: jest.fn()
}));

// Set required environment variables for testing
process.env.MOBILE_APP_URL = 'http://localhost:3000';
process.env.BASE_URL = 'http://localhost:3001';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';

// Import app after all mocks are in place
const app = require('../../src/app');

describe('Google Authentication', () => {
  test('Google auth route should redirect to Google', async () => {
    const response = await request(app).get('/auth/google');
    
    // In a real scenario, this would redirect to Google
    // With our mock, it should continue through the authentication flow
    expect(response.status).toBe(302); // Expecting a redirect
  });

  test('Google callback should handle successful authentication', async () => {
    const response = await request(app).get('/auth/google/callback');
    
    // In a real scenario, this would process the Google response
    // With our mock, it should redirect to the app with tokens
    expect(response.status).toBe(302); // Expecting a redirect to app
    expect(response.headers.location).toContain('token='); // Should contain a token
  });
});
