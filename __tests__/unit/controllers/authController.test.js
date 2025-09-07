const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../../src/models/user');
const emailService = require('../../../src/utils/emailService');

// Mock app
const express = require('express');
const authRoutes = require('../../../src/routes/auth');
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Mock emailService
jest.mock('../../../src/utils/emailService', () => ({
  sendWelcomeEmail: jest.fn().mockImplementation(() => 
    Promise.resolve({ success: true, messageId: 'test-message-id' })
  ),
  sendPasswordResetEmail: jest.fn()
}));

// Mock mongoose
jest.mock('mongoose', () => {
  const originalMongoose = jest.requireActual('mongoose');
  return {
    ...originalMongoose,
    connect: jest.fn().mockResolvedValue(true),
    connection: {
      once: jest.fn(),
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(true)
    }
  };
});

// Mock User model
jest.mock('../../../src/models/user', () => {
  return {
    findOne: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn().mockResolvedValue(true)
  };
});

describe('Auth Controller', () => {
  beforeAll(() => {
    // No need to connect to real DB - it's mocked
  });

  afterAll(() => {
    // No need to disconnect - it's mocked
  });

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    User.findOne.mockReset();
    User.create.mockReset();
  });

  describe('POST /api/auth/register', () => {
    const newUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '1234567890',
      password: 'password123'
    };

    it('should register a new user and send welcome email', async () => {
      // Mock user not found (for email and phone checks)
      User.findOne.mockResolvedValue(null);
      
      // Mock user creation
      const mockCreatedUser = {
        _id: 'mock-id',
        ...newUser,
        save: jest.fn().mockResolvedValue(true)
      };
      User.create.mockResolvedValue(mockCreatedUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      // Check response
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.emailSent).toBe(true);

      // Check user was created
      expect(User.create).toHaveBeenCalledTimes(1);
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone
      }));

      // Check welcome email was sent
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        newUser.email,
        newUser.firstName
      );
    });

    it('should register user but handle email failure gracefully', async () => {
      // Mock user not found (for email and phone checks)
      User.findOne.mockResolvedValue(null);
      
      // Mock user creation
      const mockCreatedUser = {
        _id: 'mock-id',
        ...newUser,
        save: jest.fn().mockResolvedValue(true)
      };
      User.create.mockResolvedValue(mockCreatedUser);

      // Mock email failure
      emailService.sendWelcomeEmail.mockResolvedValueOnce({ 
        success: false, 
        error: 'Email service error' 
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      // Check response includes emailSent=false
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.emailSent).toBe(false);

      // Check user was still created
      expect(User.create).toHaveBeenCalledTimes(1);
    });

    it('should reject registration with duplicate email', async () => {
      // Mock existing email
      User.findOne.mockImplementation((query) => {
        if (query.email === newUser.email) {
          return Promise.resolve({
            _id: 'existing-id',
            email: newUser.email
          });
        }
        return Promise.resolve(null);
      });

      // Try to register with email that exists
      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(400);

      expect(response.body.message).toBe('Email address already registered');
      expect(response.body.field).toBe('email');
      expect(response.body.error).toBe('duplicate');
      
      // Email should not be sent
      expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
      // User should not be created
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should reject registration with duplicate phone', async () => {
      // Mock email not found but phone exists
      User.findOne.mockImplementation((query) => {
        if (query.email) {
          return Promise.resolve(null);
        }
        if (query.phone === newUser.phone) {
          return Promise.resolve({
            _id: 'existing-id',
            phone: newUser.phone
          });
        }
        return Promise.resolve(null);
      });

      // Try to register with different email but same phone
      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(400);

      expect(response.body.message).toBe('Phone number already registered');
      expect(response.body.field).toBe('phone');
      expect(response.body.error).toBe('duplicate');
      
      // Email should not be sent
      expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
      // User should not be created
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          // Missing other required fields
        })
        .expect(400);

      expect(response.body.message).toBe('All fields are required');
      
      // Email should not be sent
      expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
      // User should not be created
      expect(User.create).not.toHaveBeenCalled();
    });
  });
});
