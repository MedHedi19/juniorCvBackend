const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Cleanup after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  
  // Stop the in-memory MongoDB instance
  await mongoServer.stop();
});

// Global test timeout
jest.setTimeout(30000);

// Mock console.log and console.error to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Helper function to create test user
global.createTestUser = async () => {
  const User = require('../models/user');
  const bcrypt = require('bcryptjs');
  
  const hashedPassword = await bcrypt.hash('testpassword', 10);
  
  const user = new User({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '+1234567890',
    password: hashedPassword
  });
  
  return await user.save();
};

// Helper function to create test job
global.createTestJob = async () => {
  const Job = require('../models/job');
  
  const job = new Job({
    title: 'Software Developer',
    company: 'Test Company',
    location: 'Tunisia',
    link: 'https://example.com/job',
    postedTime: '2 days ago',
    source: 'LinkedIn',
    description: 'Test job description',
    searchTerm: 'developer'
  });
  
  return await job.save();
};

// Helper function to create test application
global.createTestApplication = async (userId, jobId) => {
  const JobApplication = require('../models/jobApplication');
  const Job = require('../models/job');
  
  const job = await Job.findById(jobId);
  
  const application = new JobApplication({
    userId,
    jobId,
    jobSnapshot: {
      title: job.title,
      company: job.company,
      location: job.location,
      link: job.link,
      source: job.source,
      description: job.description
    }
  });
  
  return await application.save();
};

// Mock JWT for testing
global.mockJWT = {
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({ id: 'mock-user-id' }))
};

// Mock auth middleware
global.mockAuthMiddleware = (req, res, next) => {
  req.user = { id: 'mock-user-id' };
  next();
};
