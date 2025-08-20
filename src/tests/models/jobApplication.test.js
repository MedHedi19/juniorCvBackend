const mongoose = require('mongoose');
const JobApplication = require('../../models/jobApplication');
const User = require('../../models/user');
const Job = require('../../models/job');

describe('JobApplication Model', () => {
  let testUser, testJob;

  beforeEach(async () => {
    testUser = await createTestUser();
    testJob = await createTestJob();
  });

  describe('Schema Validation', () => {
    test('should create a valid job application', async () => {
      const applicationData = {
        userId: testUser._id,
        jobId: testJob._id,
        jobSnapshot: {
          title: testJob.title,
          company: testJob.company,
          location: testJob.location,
          link: testJob.link,
          source: testJob.source,
          description: testJob.description
        }
      };

      const application = new JobApplication(applicationData);
      const savedApplication = await application.save();

      expect(savedApplication._id).toBeDefined();
      expect(savedApplication.userId.toString()).toBe(testUser._id.toString());
      expect(savedApplication.jobId.toString()).toBe(testJob._id.toString());
      expect(savedApplication.status).toBe('applied');
      expect(savedApplication.isActive).toBe(true);
      expect(savedApplication.appliedAt).toBeDefined();
    });

    test('should require userId', async () => {
      const applicationData = {
        jobId: testJob._id,
        jobSnapshot: {
          title: testJob.title,
          company: testJob.company
        }
      };

      const application = new JobApplication(applicationData);
      
      await expect(application.save()).rejects.toThrow();
    });

    test('should require jobId', async () => {
      const applicationData = {
        userId: testUser._id,
        jobSnapshot: {
          title: testJob.title,
          company: testJob.company
        }
      };

      const application = new JobApplication(applicationData);
      
      await expect(application.save()).rejects.toThrow();
    });

    test('should require jobSnapshot title and company', async () => {
      const applicationData = {
        userId: testUser._id,
        jobId: testJob._id,
        jobSnapshot: {}
      };

      const application = new JobApplication(applicationData);
      
      await expect(application.save()).rejects.toThrow();
    });

    test('should validate status enum', async () => {
      const applicationData = {
        userId: testUser._id,
        jobId: testJob._id,
        jobSnapshot: {
          title: testJob.title,
          company: testJob.company
        },
        status: 'invalid_status'
      };

      const application = new JobApplication(applicationData);
      
      await expect(application.save()).rejects.toThrow();
    });

    test('should validate applicationMethod enum', async () => {
      const applicationData = {
        userId: testUser._id,
        jobId: testJob._id,
        jobSnapshot: {
          title: testJob.title,
          company: testJob.company
        },
        applicationMethod: 'invalid_method'
      };

      const application = new JobApplication(applicationData);
      
      await expect(application.save()).rejects.toThrow();
    });
  });

  describe('Unique Constraint', () => {
    test('should prevent duplicate applications for same job by same user', async () => {
      const applicationData = {
        userId: testUser._id,
        jobId: testJob._id,
        jobSnapshot: {
          title: testJob.title,
          company: testJob.company
        }
      };

      // Create first application
      const application1 = new JobApplication(applicationData);
      await application1.save();

      // Try to create duplicate application
      const application2 = new JobApplication(applicationData);
      
      await expect(application2.save()).rejects.toThrow();
    });

    test('should allow same user to apply to different jobs', async () => {
      const testJob2 = await createTestJob();
      testJob2.title = 'Different Job';
      await testJob2.save();

      const applicationData1 = {
        userId: testUser._id,
        jobId: testJob._id,
        jobSnapshot: {
          title: testJob.title,
          company: testJob.company
        }
      };

      const applicationData2 = {
        userId: testUser._id,
        jobId: testJob2._id,
        jobSnapshot: {
          title: testJob2.title,
          company: testJob2.company
        }
      };

      const application1 = new JobApplication(applicationData1);
      const application2 = new JobApplication(applicationData2);

      const saved1 = await application1.save();
      const saved2 = await application2.save();

      expect(saved1._id).toBeDefined();
      expect(saved2._id).toBeDefined();
      expect(saved1._id.toString()).not.toBe(saved2._id.toString());
    });

    test('should allow different users to apply to same job', async () => {
      const testUser2 = await createTestUser();
      testUser2.email = 'test2@example.com';
      await testUser2.save();

      const applicationData1 = {
        userId: testUser._id,
        jobId: testJob._id,
        jobSnapshot: {
          title: testJob.title,
          company: testJob.company
        }
      };

      const applicationData2 = {
        userId: testUser2._id,
        jobId: testJob._id,
        jobSnapshot: {
          title: testJob.title,
          company: testJob.company
        }
      };

      const application1 = new JobApplication(applicationData1);
      const application2 = new JobApplication(applicationData2);

      const saved1 = await application1.save();
      const saved2 = await application2.save();

      expect(saved1._id).toBeDefined();
      expect(saved2._id).toBeDefined();
      expect(saved1._id.toString()).not.toBe(saved2._id.toString());
    });
  });

  describe('Middleware and Virtuals', () => {
    test('should update lastStatusUpdate when status changes', async () => {
      const application = await createTestApplication(testUser._id, testJob._id);
      const originalUpdate = application.lastStatusUpdate;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      application.status = 'viewed';
      await application.save();

      expect(application.lastStatusUpdate.getTime()).toBeGreaterThan(originalUpdate.getTime());
    });

    test('should not update lastStatusUpdate when status does not change', async () => {
      const application = await createTestApplication(testUser._id, testJob._id);
      const originalUpdate = application.lastStatusUpdate;

      application.notes = 'Updated notes';
      await application.save();

      expect(application.lastStatusUpdate.getTime()).toBe(originalUpdate.getTime());
    });

    test('should calculate applicationAge virtual correctly', async () => {
      const application = await createTestApplication(testUser._id, testJob._id);
      
      // Mock appliedAt to be 5 days ago
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      application.appliedAt = fiveDaysAgo;
      await application.save();

      const reloadedApplication = await JobApplication.findById(application._id);
      expect(reloadedApplication.applicationAge).toBe(5);
    });
  });

  describe('Indexes', () => {
    test('should have proper indexes for performance', async () => {
      const indexes = await JobApplication.collection.getIndexes();
      
      // Check for compound unique index on userId and jobId
      const uniqueIndex = Object.keys(indexes).find(key => 
        indexes[key].some(index => 
          index.userId === 1 && index.jobId === 1 && index.unique === true
        )
      );
      
      expect(uniqueIndex).toBeDefined();
    });
  });
});
