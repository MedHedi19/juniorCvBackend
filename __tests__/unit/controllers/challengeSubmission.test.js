const request = require('supertest');
const mongoose = require('mongoose');
const UpskillingProgress = require('../../../src/models/upskillingProgress');
const User = require('../../../src/models/user');
const jwt = require('jsonwebtoken');

// Mock models before importing routes
jest.mock('../../../src/models/upskillingProgress');
jest.mock('../../../src/models/user');
jest.mock('../../../src/config/db', () => ({
  connectDB: jest.fn()
}));

// Mock app
const express = require('express');
const challengeRoutes = require('../../../src/routes/challenges');
const app = express();
app.use(express.json());
app.use('/api/challenges', challengeRoutes);

describe('Challenge Submission API', () => {
  let validToken;
  let mockUserId;

  jest.setTimeout(10000);

  beforeAll(() => {
    // Create a mock token for authentication
    mockUserId = new mongoose.Types.ObjectId();
    validToken = jwt.sign(
      { id: mockUserId.toString() },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Mock User.findById to return a valid user
    User.findById = jest.fn().mockResolvedValue({
      _id: mockUserId,
      email: 'test@example.com',
      name: 'Test User'
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/challenges/:day/submit-text', () => {
    it('should successfully submit text content for a challenge', async () => {
      const mockProgress = {
        userId: mockUserId,
        personalityColor: 'bleu',
        challenges: [],
        save: jest.fn().mockResolvedValue(true)
      };

      UpskillingProgress.findOne.mockResolvedValue(mockProgress);

      const response = await request(app)
        .post('/api/challenges/5/submit-text')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          textContent: 'This is my challenge response for day 5'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Text submitted successfully');
      expect(response.body.data.day).toBe(5);
      expect(response.body.data.submissionType).toBe('text');

      // Verify the submission was added to challenges array
      expect(mockProgress.challenges.length).toBe(1);
      expect(mockProgress.challenges[0].day).toBe(5);
      expect(mockProgress.challenges[0].submission.type).toBe('text');
      expect(mockProgress.challenges[0].submission.textContent).toBe('This is my challenge response for day 5');
      expect(mockProgress.save).toHaveBeenCalled();
    });

    it('should update existing challenge submission', async () => {
      const mockProgress = {
        userId: mockUserId,
        personalityColor: 'rouge',
        challenges: [
          {
            day: 3,
            completed: false,
            submission: {
              type: 'none'
            }
          }
        ],
        save: jest.fn().mockResolvedValue(true)
      };

      UpskillingProgress.findOne.mockResolvedValue(mockProgress);

      const response = await request(app)
        .post('/api/challenges/3/submit-text')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          textContent: 'Updated text submission'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockProgress.challenges[0].submission.type).toBe('text');
      expect(mockProgress.challenges[0].submission.textContent).toBe('Updated text submission');
      expect(mockProgress.challenges[0].submission.uploadedAt).toBeDefined();
    });

    it('should reject invalid day number', async () => {
      const response = await request(app)
        .post('/api/challenges/25/submit-text')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          textContent: 'Some text'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid day. Must be between 1 and 21');
    });

    it('should reject empty text content', async () => {
      const response = await request(app)
        .post('/api/challenges/5/submit-text')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          textContent: '   '
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Text content is required');
    });

    it('should return 404 if no challenges initialized', async () => {
      UpskillingProgress.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/challenges/5/submit-text')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          textContent: 'Some text'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No challenges initialized');
    });
  });

  describe('POST /api/challenges/:day/submit-media', () => {
    it('should successfully submit audio media', async () => {
      const mockProgress = {
        userId: mockUserId,
        personalityColor: 'jaune',
        challenges: [],
        save: jest.fn().mockResolvedValue(true)
      };

      UpskillingProgress.findOne.mockResolvedValue(mockProgress);

      const response = await request(app)
        .post('/api/challenges/10/submit-media')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          mediaUrl: 'https://cloudinary.com/audio/xyz123.mp3',
          mediaType: 'audio/mp3',
          submissionType: 'audio'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Audio submitted successfully');
      expect(response.body.data.day).toBe(10);
      expect(response.body.data.submissionType).toBe('audio');
      expect(response.body.data.mediaUrl).toBe('https://cloudinary.com/audio/xyz123.mp3');

      expect(mockProgress.challenges[0].submission.type).toBe('audio');
      expect(mockProgress.challenges[0].submission.mediaUrl).toBe('https://cloudinary.com/audio/xyz123.mp3');
      expect(mockProgress.challenges[0].submission.mediaType).toBe('audio/mp3');
    });

    it('should successfully submit video media', async () => {
      const mockProgress = {
        userId: mockUserId,
        personalityColor: 'vert',
        challenges: [],
        save: jest.fn().mockResolvedValue(true)
      };

      UpskillingProgress.findOne.mockResolvedValue(mockProgress);

      const response = await request(app)
        .post('/api/challenges/15/submit-media')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          mediaUrl: 'https://cloudinary.com/video/abc456.mp4',
          mediaType: 'video/mp4',
          submissionType: 'video'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Video submitted successfully');
      expect(mockProgress.challenges[0].submission.type).toBe('video');
    });

    it('should reject invalid submission type', async () => {
      const mockProgress = {
        userId: mockUserId,
        personalityColor: 'bleu',
        challenges: [],
        save: jest.fn().mockResolvedValue(true)
      };

      UpskillingProgress.findOne.mockResolvedValue(mockProgress);

      const response = await request(app)
        .post('/api/challenges/8/submit-media')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          mediaUrl: 'https://cloudinary.com/image/test.jpg',
          mediaType: 'image/jpeg',
          submissionType: 'image'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Submission type must be audio or video');
    });

    it('should reject missing mediaUrl', async () => {
      const response = await request(app)
        .post('/api/challenges/8/submit-media')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          submissionType: 'audio'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Media URL and submission type are required');
    });
  });

  describe('GET /api/challenges/:day/submission', () => {
    it('should retrieve text submission for a challenge', async () => {
      const mockProgress = {
        userId: mockUserId,
        personalityColor: 'rouge',
        challenges: [
          {
            day: 7,
            completed: true,
            submission: {
              type: 'text',
              textContent: 'My day 7 submission',
              uploadedAt: new Date('2025-11-20')
            }
          }
        ]
      };

      UpskillingProgress.findOne.mockResolvedValue(mockProgress);

      const response = await request(app)
        .get('/api/challenges/7/submission')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.day).toBe(7);
      expect(response.body.data.submission.type).toBe('text');
      expect(response.body.data.submission.textContent).toBe('My day 7 submission');
    });

    it('should retrieve media submission for a challenge', async () => {
      const mockProgress = {
        userId: mockUserId,
        personalityColor: 'jaune',
        challenges: [
          {
            day: 12,
            completed: true,
            submission: {
              type: 'video',
              mediaUrl: 'https://cloudinary.com/video/day12.mp4',
              mediaType: 'video/mp4',
              uploadedAt: new Date('2025-11-21')
            }
          }
        ]
      };

      UpskillingProgress.findOne.mockResolvedValue(mockProgress);

      const response = await request(app)
        .get('/api/challenges/12/submission')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.submission.type).toBe('video');
      expect(response.body.data.submission.mediaUrl).toBe('https://cloudinary.com/video/day12.mp4');
    });

    it('should return 404 when no submission exists', async () => {
      const mockProgress = {
        userId: mockUserId,
        personalityColor: 'vert',
        challenges: [
          {
            day: 5,
            completed: false,
            submission: {
              type: 'none'
            }
          }
        ]
      };

      UpskillingProgress.findOne.mockResolvedValue(mockProgress);

      const response = await request(app)
        .get('/api/challenges/5/submission')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No submission found for this challenge');
    });

    it('should return 404 when challenge day does not exist', async () => {
      const mockProgress = {
        userId: mockUserId,
        personalityColor: 'bleu',
        challenges: []
      };

      UpskillingProgress.findOne.mockResolvedValue(mockProgress);

      const response = await request(app)
        .get('/api/challenges/9/submission')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No submission found for this challenge');
    });
  });

  describe('Authorization', () => {
    it('should reject requests without token', async () => {
      const response = await request(app)
        .post('/api/challenges/5/submit-text')
        .send({
          textContent: 'Test'
        });

      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      // Temporarily make User.findById return null for invalid token
      const originalFindById = User.findById;
      User.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/challenges/5/submit-text')
        .set('Authorization', 'Bearer invalid-token-xyz')
        .send({
          textContent: 'Test'
        });

      expect(response.status).toBe(401);
      
      // Restore the original mock
      User.findById = originalFindById;
    });
  });

  describe('Edge Cases', () => {
    it('should handle day 1 correctly', async () => {
      const mockProgress = {
        userId: mockUserId,
        personalityColor: 'rouge',
        challenges: [],
        save: jest.fn().mockResolvedValue(true)
      };

      UpskillingProgress.findOne.mockResolvedValue(mockProgress);

      const response = await request(app)
        .post('/api/challenges/1/submit-text')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          textContent: 'Day 1 submission'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.day).toBe(1);
    });

    it('should handle day 21 correctly', async () => {
      const mockProgress = {
        userId: mockUserId,
        personalityColor: 'vert',
        challenges: [],
        save: jest.fn().mockResolvedValue(true)
      };

      UpskillingProgress.findOne.mockResolvedValue(mockProgress);

      const response = await request(app)
        .post('/api/challenges/21/submit-text')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          textContent: 'Final day submission'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.day).toBe(21);
    });

    it('should reject day 0', async () => {
      const response = await request(app)
        .post('/api/challenges/0/submit-text')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          textContent: 'Test'
        });

      expect(response.status).toBe(400);
    });

    it('should handle database errors gracefully', async () => {
      UpskillingProgress.findOne.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/challenges/5/submit-text')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          textContent: 'Test'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error submitting text');
    });
  });
});
