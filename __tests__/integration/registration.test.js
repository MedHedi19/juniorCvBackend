const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/user');
const emailService = require('../../src/utils/emailService');

// Mock emailService
jest.mock('../../src/utils/emailService', () => ({
  sendWelcomeEmail: jest.fn().mockImplementation(() => 
    Promise.resolve({ success: true, messageId: 'test-message-id' })
  ),
  sendPasswordResetEmail: jest.fn()
}));

describe('Registration Integration Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoURI = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/juniorCV_test';
    await mongoose.connect(mongoURI);
  });

  afterAll(async () => {
    // Disconnect from test database
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
    // Clear all mocks
    jest.clearAllMocks();
  });

  it('should complete full registration and login flow', async () => {
    const newUser = {
      firstName: 'Integration',
      lastName: 'Test',
      email: 'integration@test.com',
      phone: '9876543210',
      password: 'integration123'
    };

    // Step 1: Register new user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(newUser)
      .expect(201);

    expect(registerResponse.body.message).toBe('User registered successfully');
    expect(registerResponse.body.emailSent).toBe(true);
    expect(emailService.sendWelcomeEmail).toHaveBeenCalledTimes(1);

    // Step 2: Verify user was created in database
    const createdUser = await User.findOne({ email: newUser.email });
    expect(createdUser).toBeTruthy();
    expect(createdUser.firstName).toBe(newUser.firstName);
    expect(createdUser.lastName).toBe(newUser.lastName);

    // Step 3: Login with new credentials
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: newUser.email,
        password: newUser.password
      })
      .expect(200);

    expect(loginResponse.body.message).toBe('Login successful');
    expect(loginResponse.body.token).toBeTruthy();
    expect(loginResponse.body.refreshToken).toBeTruthy();
    expect(loginResponse.body.user).toBeTruthy();
    expect(loginResponse.body.user.email).toBe(newUser.email);

    // Step 4: Try accessing a protected route
    const token = loginResponse.body.token;
    const protectedResponse = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(protectedResponse.body).toBeTruthy();
    expect(protectedResponse.body.email).toBe(newUser.email);
  });

  it('should handle duplicate registration attempts', async () => {
    const user = {
      firstName: 'Duplicate',
      lastName: 'Test',
      email: 'duplicate@test.com',
      phone: '5555555555',
      password: 'duplicate123'
    };

    // First registration should succeed
    await request(app)
      .post('/api/auth/register')
      .send(user)
      .expect(201);

    // Reset mock to check it's not called again
    emailService.sendWelcomeEmail.mockClear();

    // Attempt with same email should fail
    const duplicateEmailResponse = await request(app)
      .post('/api/auth/register')
      .send(user)
      .expect(400);

    expect(duplicateEmailResponse.body.field).toBe('email');
    expect(duplicateEmailResponse.body.error).toBe('duplicate');
    expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();

    // Attempt with same phone but different email should fail
    const duplicatePhoneResponse = await request(app)
      .post('/api/auth/register')
      .send({
        ...user,
        email: 'different@test.com'
      })
      .expect(400);

    expect(duplicatePhoneResponse.body.field).toBe('phone');
    expect(duplicatePhoneResponse.body.error).toBe('duplicate');
    expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('should handle email service failures gracefully', async () => {
    // Mock email service failure
    emailService.sendWelcomeEmail.mockImplementationOnce(() => 
      Promise.resolve({ success: false, error: 'Email service unavailable' })
    );

    const user = {
      firstName: 'Email',
      lastName: 'Failure',
      email: 'email.failure@test.com',
      phone: '1122334455',
      password: 'emailfail123'
    };

    // Registration should still succeed but with emailSent=false
    const response = await request(app)
      .post('/api/auth/register')
      .send(user)
      .expect(201);

    expect(response.body.message).toBe('User registered successfully');
    expect(response.body.emailSent).toBe(false);

    // User should still be created
    const createdUser = await User.findOne({ email: user.email });
    expect(createdUser).toBeTruthy();
  });
});
