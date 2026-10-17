const User = require('../../../src/models/user');

// Mock dependencies
jest.mock('../../../src/models/user');
jest.mock('../../../src/config/db', () => ({
  connectDB: jest.fn()
}));

describe('Google OAuth Name Parsing Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to simulate the name parsing logic from passport.js
  const parseGoogleProfile = (profile) => {
    let firstName = '';
    let lastName = '';
    
    if (profile.name) {
      firstName = profile.name.givenName || '';
      lastName = profile.name.familyName || '';
    }
    
    // Fallback to parsing displayName if name object not available
    if (!firstName && profile.displayName) {
      const names = profile.displayName.split(' ');
      firstName = names[0] || '';
      lastName = names.length > 1 ? names.slice(1).join(' ') : '';
    }
    
    // Ensure we have at least something for required fields
    firstName = firstName || 'User';
    lastName = lastName || 'Name';
    
    return { firstName, lastName };
  };

  describe('Name Extraction from profile.name object', () => {
    it('should extract both firstName and lastName from profile.name', () => {
      const profile = {
        id: 'google-123',
        name: {
          givenName: 'John',
          familyName: 'Doe'
        },
        displayName: 'John Doe',
        emails: [{ value: 'john@gmail.com' }]
      };

      const result = parseGoogleProfile(profile);
      
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
    });

    it('should use default lastName when familyName is missing', () => {
      const profile = {
        id: 'google-456',
        name: {
          givenName: 'Madonna'
        },
        displayName: 'Madonna',
        emails: [{ value: 'madonna@gmail.com' }]
      };

      const result = parseGoogleProfile(profile);
      
      expect(result.firstName).toBe('Madonna');
      expect(result.lastName).toBe('Name');
    });

    it('should handle empty familyName', () => {
      const profile = {
        id: 'google-789',
        name: {
          givenName: 'Cher',
          familyName: ''
        },
        displayName: 'Cher',
        emails: [{ value: 'cher@gmail.com' }]
      };

      const result = parseGoogleProfile(profile);
      
      expect(result.firstName).toBe('Cher');
      expect(result.lastName).toBe('Name');
    });
  });

  describe('Name Extraction from displayName fallback', () => {
    it('should parse displayName when name object is missing', () => {
      const profile = {
        id: 'google-abc',
        displayName: 'Jane Smith',
        emails: [{ value: 'jane@gmail.com' }]
      };

      const result = parseGoogleProfile(profile);
      
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
    });

    it('should handle single word displayName', () => {
      const profile = {
        id: 'google-def',
        displayName: 'Prince',
        emails: [{ value: 'prince@gmail.com' }]
      };

      const result = parseGoogleProfile(profile);
      
      expect(result.firstName).toBe('Prince');
      expect(result.lastName).toBe('Name');
    });

    it('should handle multi-part last names', () => {
      const profile = {
        id: 'google-ghi',
        displayName: 'Mary Jane Watson',
        emails: [{ value: 'mary@gmail.com' }]
      };

      const result = parseGoogleProfile(profile);
      
      expect(result.firstName).toBe('Mary');
      expect(result.lastName).toBe('Jane Watson');
    });

    it('should handle displayName with extra spaces', () => {
      const profile = {
        id: 'google-jkl',
        displayName: 'John   Doe',
        emails: [{ value: 'john2@gmail.com' }]
      };

      const result = parseGoogleProfile(profile);
      
      expect(result.firstName).toBe('John');
      // Extra spaces will be included in the lastName
      expect(result.lastName).toContain('Doe');
    });
  });

  describe('Edge Cases and Default Values', () => {
    it('should use defaults when both name and displayName are missing', () => {
      const profile = {
        id: 'google-xyz',
        emails: [{ value: 'noname@gmail.com' }]
      };

      const result = parseGoogleProfile(profile);
      
      expect(result.firstName).toBe('User');
      expect(result.lastName).toBe('Name');
    });

    it('should use defaults when displayName is empty string', () => {
      const profile = {
        id: 'google-empty',
        displayName: '',
        emails: [{ value: 'empty@gmail.com' }]
      };

      const result = parseGoogleProfile(profile);
      
      expect(result.firstName).toBe('User');
      expect(result.lastName).toBe('Name');
    });

    it('should handle name object with empty values', () => {
      const profile = {
        id: 'google-null',
        name: {
          givenName: '',
          familyName: ''
        },
        displayName: 'Backup Name',
        emails: [{ value: 'backup@gmail.com' }]
      };

      const result = parseGoogleProfile(profile);
      
      // Should fall back to displayName
      expect(result.firstName).toBe('Backup');
      expect(result.lastName).toBe('Name');
    });
  });

  describe('User Model Creation with Parsed Names', () => {
    it('should successfully create user with parsed names', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      
      User.mockImplementation(function(data) {
        Object.assign(this, data);
        this.save = mockSave;
        this._id = 'user-123';
        return this;
      });

      const profile = {
        id: 'google-test',
        displayName: 'Test User',
        emails: [{ value: 'test@gmail.com' }],
        photos: []
      };

      const { firstName, lastName } = parseGoogleProfile(profile);
      
      const user = new User({
        firstName,
        lastName,
        email: profile.emails[0].value,
        socialAuth: { googleId: profile.id }
      });

      await user.save();

      expect(mockSave).toHaveBeenCalled();
      expect(user.firstName).toBe('Test');
      expect(user.lastName).toBe('User');
    });

    it('should create user even with minimal profile data', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      
      User.mockImplementation(function(data) {
        Object.assign(this, data);
        this.save = mockSave;
        this._id = 'user-minimal';
        return this;
      });

      const profile = {
        id: 'google-minimal',
        emails: [{ value: 'minimal@gmail.com' }]
      };

      const { firstName, lastName } = parseGoogleProfile(profile);
      
      const user = new User({
        firstName,
        lastName,
        email: profile.emails[0].value,
        socialAuth: { googleId: profile.id }
      });

      await user.save();

      expect(mockSave).toHaveBeenCalled();
      expect(user.firstName).toBe('User'); // Default
      expect(user.lastName).toBe('Name'); // Default
    });
  });

  describe('Real-world Google Profile Scenarios', () => {
    it('should handle typical Western name format', () => {
      const profile = {
        id: 'google-western',
        name: {
          givenName: 'Sarah',
          familyName: 'Connor'
        },
        displayName: 'Sarah Connor'
      };

      const result = parseGoogleProfile(profile);
      
      expect(result.firstName).toBe('Sarah');
      expect(result.lastName).toBe('Connor');
    });

    it('should handle Middle Eastern name format', () => {
      const profile = {
        id: 'google-me',
        displayName: 'Mohamed Hedi BenSalah'
      };

      const result = parseGoogleProfile(profile);
      
      expect(result.firstName).toBe('Mohamed');
      expect(result.lastName).toBe('Hedi BenSalah');
    });

    it('should handle Asian name format (single word given name)', () => {
      const profile = {
        id: 'google-asian',
        name: {
          givenName: 'Wei',
          familyName: 'Zhang'
        }
      };

      const result = parseGoogleProfile(profile);
      
      expect(result.firstName).toBe('Wei');
      expect(result.lastName).toBe('Zhang');
    });

    it('should handle mononyms (single name)', () => {
      const profiles = [
        { id: '1', displayName: 'Bono' },
        { id: '2', displayName: 'Sting' },
        { id: '3', displayName: 'Adele' }
      ];

      profiles.forEach(profile => {
        const result = parseGoogleProfile(profile);
        expect(result.firstName).toBe(profile.displayName);
        expect(result.lastName).toBe('Name');
      });
    });
  });
});
