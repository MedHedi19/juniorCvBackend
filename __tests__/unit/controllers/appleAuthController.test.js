jest.mock('apple-signin-auth', () => ({
  verifyIdToken: jest.fn(),
}));

jest.mock('../../../src/utils/token', () => ({
  generateTokens: jest.fn(() => ({
    accessToken: 'access-token-test',
    refreshToken: 'refresh-token-test',
  })),
}));

jest.mock('../../../src/utils/emailService', () => ({
  sendSocialWelcomeEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../../src/models/user', () => {
  const User = jest.fn(function (data) {
    Object.assign(this, data);
    this._id = 'new-user-id';
    this.createdAt = new Date('2026-01-01');
    this.updatedAt = new Date('2026-01-01');
    this.save = jest.fn().mockResolvedValue(this);
    return this;
  });

  User.findOne = jest.fn();
  return User;
});

const appleSigninAuth = require('apple-signin-auth');
const User = require('../../../src/models/user');
const { sendSocialWelcomeEmail } = require('../../../src/utils/emailService');
const { generateTokens } = require('../../../src/utils/token');
const { appleMobileLogin } = require('../../../src/controllers/socialAuthController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('appleMobileLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.APPLE_CLIENT_ID = 'com.JuniorsCV.app';
  });

  it('returns 400 when identityToken is missing', async () => {
    const req = { body: {} };
    const res = makeRes();

    await appleMobileLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Apple identity token is required' });
  });

  it('returns 500 when Apple env is missing', async () => {
    delete process.env.APPLE_CLIENT_ID;
    delete process.env.APPLE_BUNDLE_ID;

    const req = { body: { identityToken: 'token' } };
    const res = makeRes();

    await appleMobileLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Apple Sign-In is not configured on server' });
  });

  it('logs in an existing user linked with appleId', async () => {
    const existingUser = {
      _id: 'existing-user-id',
      firstName: 'Hedi',
      lastName: 'Ben',
      email: 'hedi@example.com',
      phone: undefined,
      profilePhoto: '',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      save: jest.fn().mockResolvedValue(true),
    };

    appleSigninAuth.verifyIdToken.mockResolvedValue({
      sub: 'apple-sub-1',
      email: 'hedi@example.com',
    });

    User.findOne.mockResolvedValueOnce(existingUser);

    const req = {
      body: {
        identityToken: 'valid-token',
        user: 'apple-user-id-1',
      },
    };
    const res = makeRes();

    await appleMobileLogin(req, res);

    expect(appleSigninAuth.verifyIdToken).toHaveBeenCalledWith('valid-token', {
      audience: 'com.JuniorsCV.app',
      ignoreExpiration: false,
    });
    expect(generateTokens).toHaveBeenCalledWith('existing-user-id');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Apple login successful',
        token: 'access-token-test',
        refreshToken: 'refresh-token-test',
        provider: 'apple',
      })
    );
  });

  it('creates a new user and sends welcome email when no linked account exists', async () => {
    appleSigninAuth.verifyIdToken.mockResolvedValue({
      sub: 'apple-sub-2',
      email: 'new@icloud.com',
    });

    User.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const req = {
      body: {
        identityToken: 'new-token',
        user: 'apple-user-id-2',
        firstName: 'New',
        lastName: 'User',
      },
    };
    const res = makeRes();

    await appleMobileLogin(req, res);

    expect(User).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'New',
        lastName: 'User',
        email: 'new@icloud.com',
        socialAuth: { appleId: 'apple-sub-2' },
      })
    );
    expect(sendSocialWelcomeEmail).toHaveBeenCalledWith('new@icloud.com', 'New', 'apple');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
