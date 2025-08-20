// Test utility functions for job application validation
describe('Job Application Validation Utils', () => {
  // Helper function to validate job application data
  const validateJobApplicationData = (data) => {
    const errors = [];

    if (!data || !data.userId) {
      errors.push('User ID is required');
    }
    
    if (!data || !data.jobId) {
      errors.push('Job ID is required');
    }

    if (!data || !data.jobSnapshot || !data.jobSnapshot.title) {
      errors.push('Job title is required');
    }

    if (!data || !data.jobSnapshot || !data.jobSnapshot.company) {
      errors.push('Company name is required');
    }
    
    if (data && data.status && !['applied', 'viewed', 'interview_scheduled', 'interview_completed', 'rejected', 'accepted', 'withdrawn'].includes(data.status)) {
      errors.push('Invalid status');
    }

    if (data && data.applicationMethod && !['direct_link', 'email', 'platform', 'other'].includes(data.applicationMethod)) {
      errors.push('Invalid application method');
    }

    if (data && data.notes && data.notes.length > 1000) {
      errors.push('Notes too long');
    }

    if (data && data.coverLetter && data.coverLetter.length > 5000) {
      errors.push('Cover letter too long');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Helper function to validate job search parameters
  const validateJobSearchParams = (params) => {
    const errors = [];
    
    if (params.page && (isNaN(Number(params.page)) || Number(params.page) < 1)) {
      errors.push('Invalid page number');
    }
    
    if (params.limit && (isNaN(Number(params.limit)) || Number(params.limit) < 1 || Number(params.limit) > 100)) {
      errors.push('Invalid limit');
    }
    
    if (params.sortOrder && !['asc', 'desc'].includes(params.sortOrder)) {
      errors.push('Invalid sort order');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Helper function to format application status
  const formatApplicationStatus = (status) => {
    const statusMap = {
      applied: 'Application Submitted',
      viewed: 'Viewed by Recruiter',
      interview_scheduled: 'Interview Scheduled',
      interview_completed: 'Interview Completed',
      rejected: 'Application Rejected',
      accepted: 'Application Accepted',
      withdrawn: 'Application Withdrawn'
    };
    
    return statusMap[status] || 'Unknown Status';
  };

  describe('validateJobApplicationData', () => {
    test('should validate correct application data', () => {
      const validData = {
        userId: 'user123',
        jobId: 'job456',
        jobSnapshot: {
          title: 'Software Developer',
          company: 'Test Company'
        },
        status: 'applied',
        applicationMethod: 'direct_link',
        notes: 'Test notes',
        coverLetter: 'Test cover letter'
      };

      const result = validateJobApplicationData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject missing required fields', () => {
      const invalidData = {};

      const result = validateJobApplicationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('User ID is required');
      expect(result.errors).toContain('Job ID is required');
      expect(result.errors).toContain('Job title is required');
      expect(result.errors).toContain('Company name is required');
    });

    test('should reject invalid status', () => {
      const invalidData = {
        userId: 'user123',
        jobId: 'job456',
        jobSnapshot: {
          title: 'Software Developer',
          company: 'Test Company'
        },
        status: 'invalid_status'
      };

      const result = validateJobApplicationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid status');
    });

    test('should reject invalid application method', () => {
      const invalidData = {
        userId: 'user123',
        jobId: 'job456',
        jobSnapshot: {
          title: 'Software Developer',
          company: 'Test Company'
        },
        applicationMethod: 'invalid_method'
      };

      const result = validateJobApplicationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid application method');
    });

    test('should reject notes that are too long', () => {
      const invalidData = {
        userId: 'user123',
        jobId: 'job456',
        jobSnapshot: {
          title: 'Software Developer',
          company: 'Test Company'
        },
        notes: 'a'.repeat(1001) // 1001 characters
      };

      const result = validateJobApplicationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Notes too long');
    });

    test('should reject cover letter that is too long', () => {
      const invalidData = {
        userId: 'user123',
        jobId: 'job456',
        jobSnapshot: {
          title: 'Software Developer',
          company: 'Test Company'
        },
        coverLetter: 'a'.repeat(5001) // 5001 characters
      };

      const result = validateJobApplicationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cover letter too long');
    });
  });

  describe('validateJobSearchParams', () => {
    test('should validate correct search parameters', () => {
      const validParams = {
        page: 1,
        limit: 20,
        sortOrder: 'desc'
      };

      const result = validateJobSearchParams(validParams);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid page number', () => {
      const invalidParams = {
        page: -1
      };

      const result = validateJobSearchParams(invalidParams);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid page number');
    });

    test('should reject invalid limit', () => {
      const invalidParams = {
        limit: 101 // Too high
      };

      const result = validateJobSearchParams(invalidParams);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid limit');
    });

    test('should reject invalid sort order', () => {
      const invalidParams = {
        sortOrder: 'invalid'
      };

      const result = validateJobSearchParams(invalidParams);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid sort order');
    });

    test('should handle string numbers correctly', () => {
      const validParams = {
        page: '2',
        limit: '10'
      };

      const result = validateJobSearchParams(validParams);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('formatApplicationStatus', () => {
    test('should format all valid statuses correctly', () => {
      expect(formatApplicationStatus('applied')).toBe('Application Submitted');
      expect(formatApplicationStatus('viewed')).toBe('Viewed by Recruiter');
      expect(formatApplicationStatus('interview_scheduled')).toBe('Interview Scheduled');
      expect(formatApplicationStatus('interview_completed')).toBe('Interview Completed');
      expect(formatApplicationStatus('rejected')).toBe('Application Rejected');
      expect(formatApplicationStatus('accepted')).toBe('Application Accepted');
      expect(formatApplicationStatus('withdrawn')).toBe('Application Withdrawn');
    });

    test('should handle unknown status', () => {
      expect(formatApplicationStatus('unknown')).toBe('Unknown Status');
      expect(formatApplicationStatus('')).toBe('Unknown Status');
      expect(formatApplicationStatus(null)).toBe('Unknown Status');
      expect(formatApplicationStatus(undefined)).toBe('Unknown Status');
    });
  });

  describe('Edge Cases and Integration', () => {
    test('should handle empty objects gracefully', () => {
      const result = validateJobApplicationData({});
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle null values gracefully', () => {
      const result = validateJobApplicationData(null);
      expect(result.isValid).toBe(false);
    });

    test('should validate complex application data', () => {
      const complexData = {
        userId: 'user123',
        jobId: 'job456',
        jobSnapshot: {
          title: 'Senior Full Stack Developer',
          company: 'Tech Innovations Inc.',
          location: 'Tunisia, Tunis',
          description: 'Looking for an experienced developer...'
        },
        status: 'interview_scheduled',
        applicationMethod: 'platform',
        notes: 'Very interested in this position. Have relevant experience.',
        coverLetter: 'Dear Hiring Manager, I am writing to express my interest...'
      };

      const result = validateJobApplicationData(complexData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate search parameters with all options', () => {
      const complexParams = {
        page: 3,
        limit: 50,
        sortOrder: 'asc',
        searchTerm: 'developer',
        location: 'Tunisia',
        status: 'applied'
      };

      const result = validateJobSearchParams(complexParams);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
