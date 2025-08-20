const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const {
  applyToJob,
  getUserApplications,
  getApplicationStatistics,
  updateApplicationStatus,
  withdrawApplication
} = require('../../controllers/jobApplicationController');

// Create express app for testing
const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, res, next) => {
  req.user = { id: 'mock-user-id' };
  next();
});

// Setup routes
app.post('/apply', applyToJob);
app.get('/applications', getUserApplications);
app.get('/stats', getApplicationStatistics);
app.put('/applications/:applicationId/status', updateApplicationStatus);
app.delete('/applications/:applicationId', withdrawApplication);

describe('Job Application Controller', () => {
  let testUser, testJob, testApplication;

  beforeEach(async () => {
    testUser = await createTestUser();
    testJob = await createTestJob();
    
    // Override mock user ID with actual test user ID
    app.use((req, res, next) => {
      req.user = { id: testUser._id.toString() };
      next();
    });
  });

  describe('POST /apply - Apply to Job', () => {
    test('should successfully apply to a job', async () => {
      const applicationData = {
        jobId: testJob._id.toString(),
        notes: 'Test application notes',
        applicationMethod: 'direct_link'
      };

      const response = await request(app)
        .post('/apply')
        .send(applicationData)
        .expect(201);

      expect(response.body.message).toBe('Application submitted successfully');
      expect(response.body.application).toBeDefined();
      expect(response.body.application.userId).toBe(testUser._id.toString());
      expect(response.body.application.jobId).toBe(testJob._id.toString());
      expect(response.body.application.notes).toBe('Test application notes');
    });

    test('should fail when jobId is missing', async () => {
      const applicationData = {
        notes: 'Test application notes'
      };

      const response = await request(app)
        .post('/apply')
        .send(applicationData)
        .expect(400);

      expect(response.body.message).toBe('Job ID is required');
    });

    test('should fail when job does not exist', async () => {
      const nonExistentJobId = new mongoose.Types.ObjectId();
      const applicationData = {
        jobId: nonExistentJobId.toString(),
        notes: 'Test application notes'
      };

      const response = await request(app)
        .post('/apply')
        .send(applicationData)
        .expect(404);

      expect(response.body.message).toBe('Job not found');
    });

    test('should prevent duplicate applications', async () => {
      // Create first application
      await createTestApplication(testUser._id, testJob._id);

      const applicationData = {
        jobId: testJob._id.toString(),
        notes: 'Duplicate application'
      };

      const response = await request(app)
        .post('/apply')
        .send(applicationData)
        .expect(409);

      expect(response.body.message).toBe('You have already applied to this job');
      expect(response.body.applicationId).toBeDefined();
    });

    test('should create job snapshot correctly', async () => {
      const applicationData = {
        jobId: testJob._id.toString(),
        notes: 'Test application'
      };

      const response = await request(app)
        .post('/apply')
        .send(applicationData)
        .expect(201);

      const application = response.body.application;
      expect(application.jobSnapshot.title).toBe(testJob.title);
      expect(application.jobSnapshot.company).toBe(testJob.company);
      expect(application.jobSnapshot.location).toBe(testJob.location);
      expect(application.jobSnapshot.source).toBe(testJob.source);
    });
  });

  describe('GET /applications - Get User Applications', () => {
    beforeEach(async () => {
      // Create multiple test applications
      testApplication = await createTestApplication(testUser._id, testJob._id);
      
      const testJob2 = await createTestJob();
      testJob2.title = 'Backend Developer';
      testJob2.company = 'Another Company';
      await testJob2.save();
      
      const application2 = await createTestApplication(testUser._id, testJob2._id);
      application2.status = 'viewed';
      await application2.save();
    });

    test('should get all user applications', async () => {
      const response = await request(app)
        .get('/applications')
        .expect(200);

      expect(response.body.applications).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.totalApplications).toBe(2);
    });

    test('should filter applications by status', async () => {
      const response = await request(app)
        .get('/applications?status=viewed')
        .expect(200);

      expect(response.body.applications).toHaveLength(1);
      expect(response.body.applications[0].status).toBe('viewed');
    });

    test('should search applications by company', async () => {
      const response = await request(app)
        .get('/applications?company=Another')
        .expect(200);

      expect(response.body.applications).toHaveLength(1);
      expect(response.body.applications[0].jobSnapshot.company).toBe('Another Company');
    });

    test('should search applications by search term', async () => {
      const response = await request(app)
        .get('/applications?searchTerm=Backend')
        .expect(200);

      expect(response.body.applications).toHaveLength(1);
      expect(response.body.applications[0].jobSnapshot.title).toBe('Backend Developer');
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/applications?page=1&limit=1')
        .expect(200);

      expect(response.body.applications).toHaveLength(1);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
      expect(response.body.pagination.hasNext).toBe(true);
    });

    test('should sort applications correctly', async () => {
      const response = await request(app)
        .get('/applications?sortBy=appliedAt&sortOrder=asc')
        .expect(200);

      expect(response.body.applications).toHaveLength(2);
      // First application should be older
      const firstApp = response.body.applications[0];
      const secondApp = response.body.applications[1];
      expect(new Date(firstApp.appliedAt).getTime()).toBeLessThanOrEqual(new Date(secondApp.appliedAt).getTime());
    });
  });

  describe('GET /stats - Get Application Statistics', () => {
    beforeEach(async () => {
      // Create applications with different statuses
      const app1 = await createTestApplication(testUser._id, testJob._id);
      
      const testJob2 = await createTestJob();
      testJob2.title = 'Backend Developer';
      await testJob2.save();
      
      const app2 = await createTestApplication(testUser._id, testJob2._id);
      app2.status = 'viewed';
      await app2.save();
      
      const testJob3 = await createTestJob();
      testJob3.title = 'Frontend Developer';
      await testJob3.save();
      
      const app3 = await createTestApplication(testUser._id, testJob3._id);
      app3.status = 'accepted';
      await app3.save();
    });

    test('should return application statistics', async () => {
      const response = await request(app)
        .get('/stats')
        .expect(200);

      expect(response.body.overview).toBeDefined();
      expect(response.body.overview.totalApplications).toBe(3);
      expect(response.body.statusBreakdown).toBeDefined();
      expect(response.body.recentApplications).toBeDefined();
      
      // Check status breakdown
      const statusBreakdown = response.body.statusBreakdown;
      const appliedCount = statusBreakdown.find(s => s._id === 'applied')?.count || 0;
      const viewedCount = statusBreakdown.find(s => s._id === 'viewed')?.count || 0;
      const acceptedCount = statusBreakdown.find(s => s._id === 'accepted')?.count || 0;
      
      expect(appliedCount).toBe(1);
      expect(viewedCount).toBe(1);
      expect(acceptedCount).toBe(1);
    });

    test('should limit recent applications to 5', async () => {
      const response = await request(app)
        .get('/stats')
        .expect(200);

      expect(response.body.recentApplications.length).toBeLessThanOrEqual(5);
    });
  });

  describe('PUT /applications/:applicationId/status - Update Application Status', () => {
    beforeEach(async () => {
      testApplication = await createTestApplication(testUser._id, testJob._id);
    });

    test('should successfully update application status', async () => {
      const updateData = {
        status: 'viewed',
        notes: 'Updated notes'
      };

      const response = await request(app)
        .put(`/applications/${testApplication._id}/status`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Application status updated successfully');
      expect(response.body.application.status).toBe('viewed');
      expect(response.body.application.notes).toBe('Updated notes');
    });

    test('should fail with invalid status', async () => {
      const updateData = {
        status: 'invalid_status'
      };

      const response = await request(app)
        .put(`/applications/${testApplication._id}/status`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toBe('Invalid status');
    });

    test('should fail when application not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = {
        status: 'viewed'
      };

      const response = await request(app)
        .put(`/applications/${nonExistentId}/status`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toBe('Application not found');
    });

    test('should update lastStatusUpdate timestamp', async () => {
      const originalTimestamp = testApplication.lastStatusUpdate;
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updateData = {
        status: 'viewed'
      };

      const response = await request(app)
        .put(`/applications/${testApplication._id}/status`)
        .send(updateData)
        .expect(200);

      expect(new Date(response.body.application.lastStatusUpdate).getTime())
        .toBeGreaterThan(originalTimestamp.getTime());
    });
  });

  describe('DELETE /applications/:applicationId - Withdraw Application', () => {
    beforeEach(async () => {
      testApplication = await createTestApplication(testUser._id, testJob._id);
    });

    test('should successfully withdraw application', async () => {
      const response = await request(app)
        .delete(`/applications/${testApplication._id}`)
        .expect(200);

      expect(response.body.message).toBe('Application withdrawn successfully');
      
      // Verify application is marked as withdrawn and inactive
      const JobApplication = require('../../models/jobApplication');
      const updatedApplication = await JobApplication.findById(testApplication._id);
      expect(updatedApplication.status).toBe('withdrawn');
      expect(updatedApplication.isActive).toBe(false);
    });

    test('should fail when application not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/applications/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toBe('Application not found');
    });

    test('should not allow withdrawing other users applications', async () => {
      const otherUser = await createTestUser();
      otherUser.email = 'other@example.com';
      await otherUser.save();
      
      const otherApplication = await createTestApplication(otherUser._id, testJob._id);

      const response = await request(app)
        .delete(`/applications/${otherApplication._id}`)
        .expect(404);

      expect(response.body.message).toBe('Application not found');
    });
  });
});
