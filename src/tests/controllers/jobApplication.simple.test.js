// Simplified job application controller tests
const {
  applyToJob,
  getUserApplications,
  getApplicationStatistics,
  updateApplicationStatus,
  withdrawApplication
} = require('../../controllers/jobApplicationController');

// Mock the models
const mockJobApplication = {
  findOne: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
  prototype: {
    save: jest.fn()
  }
};

const mockJob = {
  findById: jest.fn()
};

// Mock mongoose
jest.mock('mongoose', () => ({
  Types: {
    ObjectId: jest.fn(() => 'mock-object-id')
  }
}));

// Mock the models
jest.mock('../../models/jobApplication', () => {
  const mockConstructor = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: 'mock-application-id',
    save: jest.fn().mockResolvedValue({
      ...data,
      _id: 'mock-application-id',
      appliedAt: new Date(),
      lastStatusUpdate: new Date()
    })
  }));
  
  mockConstructor.findOne = mockJobApplication.findOne;
  mockConstructor.find = mockJobApplication.find;
  mockConstructor.findById = mockJobApplication.findById;
  mockConstructor.countDocuments = mockJobApplication.countDocuments;
  mockConstructor.aggregate = mockJobApplication.aggregate;
  
  return mockConstructor;
});

jest.mock('../../models/job', () => ({
  findById: mockJob.findById
}));

describe('Job Application Controller - Simple Tests', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      user: { id: 'mock-user-id' },
      body: {},
      query: {},
      params: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('applyToJob', () => {
    test('should successfully apply to a job', async () => {
      // Mock job exists
      mockJob.findById.mockResolvedValue({
        _id: 'mock-job-id',
        title: 'Software Developer',
        company: 'Test Company',
        location: 'Tunisia',
        link: 'https://example.com/job',
        source: 'LinkedIn',
        description: 'Test job description'
      });

      // Mock no existing application
      mockJobApplication.findOne.mockResolvedValue(null);

      mockReq.body = {
        jobId: 'mock-job-id',
        notes: 'Test application notes',
        applicationMethod: 'direct_link'
      };

      await applyToJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Application submitted successfully',
          application: expect.any(Object)
        })
      );
    });

    test('should fail when jobId is missing', async () => {
      mockReq.body = {
        notes: 'Test application notes'
      };

      await applyToJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Job ID is required'
      });
    });

    test('should fail when job does not exist', async () => {
      mockJob.findById.mockResolvedValue(null);

      mockReq.body = {
        jobId: 'non-existent-job-id'
      };

      await applyToJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Job not found'
      });
    });

    test('should prevent duplicate applications', async () => {
      // Mock job exists
      mockJob.findById.mockResolvedValue({
        _id: 'mock-job-id',
        title: 'Software Developer',
        company: 'Test Company'
      });

      // Mock existing application
      mockJobApplication.findOne.mockResolvedValue({
        _id: 'existing-application-id',
        appliedAt: new Date()
      });

      mockReq.body = {
        jobId: 'mock-job-id'
      };

      await applyToJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'You have already applied to this job',
          applicationId: 'existing-application-id'
        })
      );
    });

    test('should handle database errors', async () => {
      mockJob.findById.mockRejectedValue(new Error('Database error'));

      mockReq.body = {
        jobId: 'mock-job-id'
      };

      await applyToJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error submitting application'
        })
      );
    });
  });

  describe('getUserApplications', () => {
    test('should get user applications successfully', async () => {
      const mockApplications = [
        {
          _id: 'app1',
          jobSnapshot: {
            title: 'Software Developer',
            company: 'Test Company'
          },
          status: 'applied',
          appliedAt: new Date()
        }
      ];

      // Mock the query chain
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockApplications)
      };

      mockJobApplication.find.mockReturnValue(mockQuery);
      mockJobApplication.countDocuments.mockResolvedValue(1);

      await getUserApplications(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          applications: mockApplications,
          pagination: expect.objectContaining({
            currentPage: 1,
            totalApplications: 1
          })
        })
      );
    });

    test('should handle query parameters', async () => {
      mockReq.query = {
        status: 'applied',
        page: '2',
        limit: '10',
        searchTerm: 'developer'
      };

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      mockJobApplication.find.mockReturnValue(mockQuery);
      mockJobApplication.countDocuments.mockResolvedValue(0);

      await getUserApplications(mockReq, mockRes);

      expect(mockJobApplication.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'mock-user-id',
          status: 'applied',
          $or: expect.any(Array)
        })
      );
    });
  });

  describe('updateApplicationStatus', () => {
    test('should update application status successfully', async () => {
      const mockApplication = {
        _id: 'mock-app-id',
        status: 'applied',
        save: jest.fn().mockResolvedValue({
          _id: 'mock-app-id',
          status: 'viewed',
          lastStatusUpdate: new Date()
        })
      };

      mockJobApplication.findOne.mockResolvedValue(mockApplication);

      mockReq.params = { applicationId: 'mock-app-id' };
      mockReq.body = { status: 'viewed', notes: 'Updated notes' };

      await updateApplicationStatus(mockReq, mockRes);

      expect(mockApplication.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Application status updated successfully'
        })
      );
    });

    test('should reject invalid status', async () => {
      mockReq.params = { applicationId: 'mock-app-id' };
      mockReq.body = { status: 'invalid_status' };

      await updateApplicationStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid status'
      });
    });

    test('should handle application not found', async () => {
      mockJobApplication.findOne.mockResolvedValue(null);

      mockReq.params = { applicationId: 'non-existent-id' };
      mockReq.body = { status: 'viewed' };

      await updateApplicationStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Application not found'
      });
    });
  });

  describe('withdrawApplication', () => {
    test('should withdraw application successfully', async () => {
      const mockApplication = {
        _id: 'mock-app-id',
        status: 'applied',
        isActive: true,
        save: jest.fn().mockResolvedValue({
          _id: 'mock-app-id',
          status: 'withdrawn',
          isActive: false
        })
      };

      mockJobApplication.findOne.mockResolvedValue(mockApplication);

      mockReq.params = { applicationId: 'mock-app-id' };

      await withdrawApplication(mockReq, mockRes);

      expect(mockApplication.save).toHaveBeenCalled();
      expect(mockApplication.status).toBe('withdrawn');
      expect(mockApplication.isActive).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Application withdrawn successfully'
      });
    });
  });
});
