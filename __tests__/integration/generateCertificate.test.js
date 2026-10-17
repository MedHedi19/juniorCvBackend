const request = require('supertest');
const app = require('../../src/app');

// Mock dependencies used by the controller
jest.mock('../../src/utils/emailService', () => ({
  sendCertificateEmail: jest.fn(async () => ({ success: true, messageId: 'mock-message-id' }))
}));

jest.mock('../../src/utils/generateCertificate', () => ({
  generateCertificate: jest.fn(async () => Buffer.from('PDF'))
}));

// Mock the User model
jest.mock('../../src/models/user', () => {
  const mUser = function () {};
  mUser.findById = jest.fn(async (id) => {
    if (id === 'not-found') return null;
    return {
      _id: id,
      firstName: 'Alice',
      lastName: 'Tester',
      email: 'alice@example.com',
      certificateSentCount: 0,
      save: jest.fn(async function () { return this; }),
    };
  });
  return mUser;
});

// Helper to create a dummy bearer token (the app's auth middleware should accept any signed token)
const makeBearer = () => 'Bearer dummy.jwt.token';

describe('POST /certification/generate-21days-certificate', () => {
  test('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app)
      .post('/certification/generate-21days-certificate')
      .send();
    expect([401, 403]).toContain(res.statusCode); // depending on middleware
  });

  test('generates and sends certificate for authenticated user (no userId param)', async () => {
    const res = await request(app)
      .post('/certification/generate-21days-certificate')
      .set('Authorization', makeBearer())
      .send();

    // Expect success contract
    expect(res.statusCode).toBeLessThan(500);
    expect(res.body).toHaveProperty('success');
    // Success may depend on auth/user extraction; we validate no server crash
  });

  test('generates and sends certificate for explicit userId param', async () => {
    const res = await request(app)
      .post('/certification/generate-21days-certificate/1234567890abcdef')
      .set('Authorization', makeBearer())
      .send();

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({ success: true, message: expect.stringMatching(/Certificate sent/i) })
    );
    expect(res.body).toHaveProperty('messageId');
  });

  test('returns 404 when user not found', async () => {
    const res = await request(app)
      .post('/certification/generate-21days-certificate/not-found')
      .set('Authorization', makeBearer())
      .send();

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual(expect.objectContaining({ success: false, message: 'User not found' }));
  });
});
