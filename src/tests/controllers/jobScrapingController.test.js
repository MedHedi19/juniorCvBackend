const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const {
  scrapeAndSaveJobs,
  getScrapedJobs
} = require('../../controllers/jobScrapingController');

// Mock the scrapers to avoid actual web scraping in tests
jest.mock('../../scrapers/linkedinScraper', () => ({
  scrapeLinkedInJobs: jest.fn(() => Promise.resolve([
    {
      title: 'Software Developer',
      company: 'LinkedIn Company',
      location: 'Tunisia',
      link: 'https://linkedin.com/job1',
      postedTime: '2 days ago',
      description: 'Test job description'
    }
  ]))
}));

jest.mock('../../scrapers/emploiScraper', () => ({
  scrapeEmploiJobs: jest.fn(() => Promise.resolve([
    {
      title: 'Backend Developer',
      company: 'Emploi Company',
      location: 'Tunis',
      link: 'https://emploi.tn/job1',
      postedTime: '1 day ago',
      description: 'Backend job description'
    }
  ]))
}));

jest.mock('../../scrapers/tanitJobsScraper', () => ({
  scrapeTanitJobs: jest.fn(() => Promise.resolve([
    {
      title: 'Frontend Developer',
      company: 'Tanit Company',
      location: 'Sfax',
      link: 'https://tanitjobs.com/job1',
      postedTime: '3 days ago',
      description: 'Frontend job description'
    }
  ]))
}));

// Create express app for testing
const app = express();
app.use(express.json());

// Setup routes
app.post('/scrape', scrapeAndSaveJobs);
app.get('/jobs', getScrapedJobs);

describe('Job Scraping Controller', () => {
  beforeEach(async () => {
    // Clear any existing jobs
    const Job = require('../../models/job');
    await Job.deleteMany({});
  });

  describe('POST /scrape - Scrape and Save Jobs', () => {
    test('should scrape and save jobs successfully', async () => {
      const scrapeData = {
        searchTerm: 'developer',
        location: 'Tunisia',
        maxJobsPerSite: 5
      };

      const response = await request(app)
        .post('/scrape')
        .send(scrapeData)
        .expect(200);

      expect(response.body.message).toBe('Jobs scraped and saved successfully');
      expect(response.body.totalJobsScraped).toBeGreaterThan(0);
      expect(response.body.jobsSaved).toBeGreaterThan(0);
      expect(response.body.sources).toContain('LinkedIn');
      expect(response.body.sources).toContain('Emploi.tn');
      expect(response.body.sources).toContain('TanitJobs');
    });

    test('should accept parameters from query string', async () => {
      const response = await request(app)
        .post('/scrape?searchTerm=developer&location=Tunis&maxJobsPerSite=3')
        .expect(200);

      expect(response.body.message).toBe('Jobs scraped and saved successfully');
      expect(response.body.totalJobsScraped).toBeGreaterThan(0);
    });

    test('should use default values when parameters not provided', async () => {
      const response = await request(app)
        .post('/scrape')
        .send({ searchTerm: 'developer' })
        .expect(200);

      expect(response.body.message).toBe('Jobs scraped and saved successfully');
      // Should use default location 'Tunisia' and maxJobsPerSite 10
    });

    test('should handle scraping errors gracefully', async () => {
      // Mock one scraper to throw an error
      const linkedinScraper = require('../../scrapers/linkedinScraper');
      linkedinScraper.scrapeLinkedInJobs.mockRejectedValueOnce(new Error('Scraping failed'));

      const scrapeData = {
        searchTerm: 'developer',
        location: 'Tunisia'
      };

      const response = await request(app)
        .post('/scrape')
        .send(scrapeData)
        .expect(200);

      // Should still succeed with other scrapers
      expect(response.body.message).toBe('Jobs scraped and saved successfully');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test('should prevent duplicate jobs', async () => {
      const scrapeData = {
        searchTerm: 'developer',
        location: 'Tunisia'
      };

      // First scrape
      const response1 = await request(app)
        .post('/scrape')
        .send(scrapeData)
        .expect(200);

      const firstScrapeCount = response1.body.jobsSaved;

      // Second scrape with same data
      const response2 = await request(app)
        .post('/scrape')
        .send(scrapeData)
        .expect(200);

      // Should have fewer new jobs saved due to duplicates
      expect(response2.body.jobsSaved).toBeLessThanOrEqual(firstScrapeCount);
      expect(response2.body.duplicatesSkipped).toBeGreaterThan(0);
    });
  });

  describe('GET /jobs - Get Scraped Jobs', () => {
    beforeEach(async () => {
      // Create test jobs
      const Job = require('../../models/job');
      
      const jobs = [
        {
          title: 'Software Developer',
          company: 'Tech Company',
          location: 'Tunisia',
          link: 'https://example.com/job1',
          postedTime: '1 day ago',
          source: 'LinkedIn',
          description: 'Software development job',
          searchTerm: 'developer'
        },
        {
          title: 'Backend Developer',
          company: 'Backend Corp',
          location: 'Tunis',
          link: 'https://example.com/job2',
          postedTime: '2 days ago',
          source: 'Emploi.tn',
          description: 'Backend development job',
          searchTerm: 'backend'
        },
        {
          title: 'Frontend Developer',
          company: 'Frontend Inc',
          location: 'Sfax',
          link: 'https://example.com/job3',
          postedTime: '3 days ago',
          source: 'TanitJobs',
          description: 'Frontend development job',
          searchTerm: 'frontend'
        }
      ];

      await Job.insertMany(jobs);
    });

    test('should get all jobs without filters', async () => {
      const response = await request(app)
        .get('/jobs')
        .expect(200);

      expect(response.body.jobs).toHaveLength(3);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.totalJobs).toBe(3);
    });

    test('should filter jobs by search term', async () => {
      const response = await request(app)
        .get('/jobs?searchTerm=backend')
        .expect(200);

      expect(response.body.jobs).toHaveLength(1);
      expect(response.body.jobs[0].title).toBe('Backend Developer');
    });

    test('should filter jobs by location', async () => {
      const response = await request(app)
        .get('/jobs?location=Tunis')
        .expect(200);

      expect(response.body.jobs).toHaveLength(1);
      expect(response.body.jobs[0].location).toBe('Tunis');
    });

    test('should filter jobs by source', async () => {
      const response = await request(app)
        .get('/jobs?source=LinkedIn')
        .expect(200);

      expect(response.body.jobs).toHaveLength(1);
      expect(response.body.jobs[0].source).toBe('LinkedIn');
    });

    test('should filter jobs by company', async () => {
      const response = await request(app)
        .get('/jobs?company=Tech')
        .expect(200);

      expect(response.body.jobs).toHaveLength(1);
      expect(response.body.jobs[0].company).toBe('Tech Company');
    });

    test('should support multiple filters', async () => {
      const response = await request(app)
        .get('/jobs?searchTerm=developer&location=Tunisia')
        .expect(200);

      expect(response.body.jobs).toHaveLength(1);
      expect(response.body.jobs[0].title).toBe('Software Developer');
      expect(response.body.jobs[0].location).toBe('Tunisia');
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/jobs?page=1&limit=2')
        .expect(200);

      expect(response.body.jobs).toHaveLength(2);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
      expect(response.body.pagination.hasNext).toBe(true);
      expect(response.body.pagination.hasPrev).toBe(false);
    });

    test('should support sorting', async () => {
      const response = await request(app)
        .get('/jobs?sortBy=title&sortOrder=asc')
        .expect(200);

      expect(response.body.jobs).toHaveLength(3);
      expect(response.body.jobs[0].title).toBe('Backend Developer');
      expect(response.body.jobs[1].title).toBe('Frontend Developer');
      expect(response.body.jobs[2].title).toBe('Software Developer');
    });

    test('should search across multiple fields with searchTerm', async () => {
      const response = await request(app)
        .get('/jobs?searchTerm=development')
        .expect(200);

      // Should find jobs with 'development' in title or description
      expect(response.body.jobs.length).toBeGreaterThan(0);
      response.body.jobs.forEach(job => {
        expect(
          job.title.toLowerCase().includes('development') ||
          job.description.toLowerCase().includes('development') ||
          job.searchTerm.toLowerCase().includes('development')
        ).toBe(true);
      });
    });

    test('should return empty array when no jobs match filters', async () => {
      const response = await request(app)
        .get('/jobs?searchTerm=nonexistent')
        .expect(200);

      expect(response.body.jobs).toHaveLength(0);
      expect(response.body.pagination.totalJobs).toBe(0);
    });

    test('should handle invalid page numbers gracefully', async () => {
      const response = await request(app)
        .get('/jobs?page=999&limit=10')
        .expect(200);

      expect(response.body.jobs).toHaveLength(0);
      expect(response.body.pagination.currentPage).toBe(999);
    });

    test('should only return active jobs', async () => {
      // Mark one job as inactive
      const Job = require('../../models/job');
      await Job.findOneAndUpdate(
        { title: 'Software Developer' },
        { isActive: false }
      );

      const response = await request(app)
        .get('/jobs')
        .expect(200);

      expect(response.body.jobs).toHaveLength(2);
      expect(response.body.jobs.every(job => job.isActive !== false)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors in scraping', async () => {
      // Mock mongoose to throw an error
      const Job = require('../../models/job');
      const originalSave = Job.prototype.save;
      Job.prototype.save = jest.fn().mockRejectedValue(new Error('Database error'));

      const scrapeData = {
        searchTerm: 'developer',
        location: 'Tunisia'
      };

      const response = await request(app)
        .post('/scrape')
        .send(scrapeData)
        .expect(500);

      expect(response.body.message).toBe('Error scraping jobs');

      // Restore original method
      Job.prototype.save = originalSave;
    });

    test('should handle database errors in getting jobs', async () => {
      // Mock Job.find to throw an error
      const Job = require('../../models/job');
      const originalFind = Job.find;
      Job.find = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app)
        .get('/jobs')
        .expect(500);

      expect(response.body.message).toBe('Error fetching jobs');

      // Restore original method
      Job.find = originalFind;
    });
  });
});
