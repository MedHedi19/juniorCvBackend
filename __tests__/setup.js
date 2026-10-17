// Consolidated setup file for Jest tests in the Node.js backend

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup the in-memory MongoDB server
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  const mongooseOpts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  };

  await mongoose.connect(uri, mongooseOpts);
});

// Clean up database between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Close connection and stop MongoDB server after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'mocked-message-id',
      response: 'mocked-response',
    }),
    verify: jest.fn().mockResolvedValue(true),
  }),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked-token'),
  verify: jest.fn().mockReturnValue({ id: 'mocked-user-id', email: 'test@example.com' }),
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('mocked-salt'),
  hash: jest.fn().mockResolvedValue('mocked-hash'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  put: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} }),
  create: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  }),
}));

// Mock puppeteer for job scraping
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      goto: jest.fn().mockResolvedValue(null),
      content: jest.fn().mockResolvedValue('<html></html>'),
      close: jest.fn().mockResolvedValue(null),
    }),
    close: jest.fn().mockResolvedValue(null),
  }),
}));

// Mock cheerio
jest.mock('cheerio', () => ({
  load: jest.fn().mockReturnValue(() => ({
    find: jest.fn().mockReturnValue([]),
  })),
}));

// Global beforeEach to clean up mocks
beforeEach(() => {
  jest.clearAllMocks();
});
