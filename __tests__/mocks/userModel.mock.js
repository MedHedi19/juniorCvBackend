// Mock for the User model
const mockUser = {
  _id: 'mock-user-id',
  firstName: 'Test',
  lastName: 'User',
  email: 'testuser@gmail.com',
  profilePhoto: 'https://example.com/photo.jpg',
  socialAuth: {
    googleId: '123456789'
  },
  refreshToken: 'mock-refresh-token',
  save: jest.fn().mockResolvedValue(true)
};

// Mock implementations
const findOne = jest.fn().mockImplementation(query => {
  if (query.email === 'testuser@gmail.com' || 
      query['socialAuth.googleId'] === '123456789' ||
      query.refreshToken === 'mock-refresh-token') {
    return Promise.resolve(mockUser);
  }
  return Promise.resolve(null);
});

const findById = jest.fn().mockImplementation(id => {
  if (id === 'mock-user-id') {
    return Promise.resolve(mockUser);
  }
  return Promise.resolve(null);
});

const userClass = jest.fn().mockImplementation(userData => {
  return {
    ...mockUser,
    ...userData,
    save: jest.fn().mockResolvedValue(true)
  };
});

// Export the mock model
module.exports = userClass;
module.exports.findOne = findOne;
module.exports.findById = findById;
module.exports.mockUser = mockUser;
