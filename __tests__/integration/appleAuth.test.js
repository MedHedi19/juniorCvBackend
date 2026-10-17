const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.APPLE_CLIENT_ID = 'com.JuniorsCV.app';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';

jest.mock('../../src/config/passport', () => {
  return jest.fn().mockImplementation(() => null);
});

jest.mock('apple-signin-auth', () => ({
  verifyIdToken: jest.fn(),
}));

jest.mock('../../src/utils/token', () => ({
  generateTokens: jest.fn(() => ({
    accessToken: 'integration-access-token',
    refreshToken: 'integration-refresh-token',
  })),
  verifyRefreshToken: jest.fn(() => ({ id: 'user-id' })),
}));

jest.mock('../../src/utils/emailService', () => ({
  sendSocialWelcomeEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/models/user', () => {
  const User = jest.fn(function (data) {
    Object.assign(this, data);
    this._id = 'created-user-id';
    this.createdAt = new Date('2026-01-01');
    this.updatedAt = new Date('2026-01-01');
    this.save = jest.fn().mockResolvedValue(this);
    return this;
  });

  User.findOne = jest.fn();
  User.findById = jest.fn();
  return User;
});

const appleSigninAuth = require('apple-signin-auth');
const User = require('../../src/models/user');
const app = require('../../src/app');

describe('Apple mobile auth endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.APPLE_CLIENT_ID = 'com.JuniorsCV.app';
  });

  it('should return 400 when identityToken is missing', async () => {
    const response = await request(app).post('/auth/apple/mobile').send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Apple identity token is required');
  });

  it('should return 200 for existing Apple-linked user', async () => {
    const existingUser = {
      _id: 'existing-user-id',
      firstName: 'Apple',
      lastName: 'Linked',
      email: 'apple.linked@example.com',
      phone: undefined,
      profilePhoto: '',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      save: jest.fn().mockResolvedValue(true),
    };

    appleSigninAuth.verifyIdToken.mockResolvedValue({
      sub: 'apple-sub-existing',
      email: 'apple.linked@example.com',
    });

    User.findOne.mockResolvedValueOnce(existingUser);

    const response = await request(app).post('/auth/apple/mobile').send({
      identityToken: 'valid-identity-token',
      user: 'apple-user-1',
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Apple login successful');
    expect(response.body.provider).toBe('apple');
    expect(response.body.token).toBe('integration-access-token');
    expect(response.body.refreshToken).toBe('integration-refresh-token');
  });

  it('should create user and return 200 when no existing account matches', async () => {
    appleSigninAuth.verifyIdToken.mockResolvedValue({
      sub: 'apple-sub-new',
      email: 'new.apple@icloud.com',
    });

    User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const response = await request(app).post('/auth/apple/mobile').send({
      identityToken: 'new-token',
      user: 'apple-user-new',
      firstName: 'New',
      lastName: 'AppleUser',
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Apple login successful');
    expect(User).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new.apple@icloud.com',
        socialAuth: { appleId: 'apple-sub-new' },
      })
    );
  });
});
