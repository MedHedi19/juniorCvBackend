# Web Scraping Module Testing Guide

## Prerequisites

Before testing, make sure you have:

1. **Install Dependencies:**
   ```bash
   npm install puppeteer cheerio axios
   ```

2. **Environment Variables:**
   Create or update your `.env` file with:
   ```
   MONGODB_URI=your_mongodb_connection_string
   ```

## Testing Steps

### Step 1: Quick Dependencies Check
```bash
node -e "console.log('Testing imports...'); try { require('puppeteer'); require('cheerio'); require('axios'); console.log('✅ All dependencies installed'); } catch(e) { console.log('❌ Missing dependencies:', e.message); }"
```

### Step 2: Run the Test Suite
```bash
node test-scraping.js
```

### Step 3: Manual Testing (Alternative)
If the full test fails, you can test components individually:

```javascript
// Test 1: Simple TanitJobs test
const JobScraper = require('./src/scrapers/jobScraper');
const scraper = new JobScraper();

scraper.scrapeTanitJobs('developer', 3).then(jobs => {
    console.log('Found jobs:', jobs.length);
    console.log('Sample:', jobs[0]);
});
```

### Step 4: Test API Routes (After Integration)
```bash
# Test scraping endpoint
curl -X POST http://localhost:3000/jobs/scrape \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"searchTerm": "developer", "location": "Tunisia", "maxJobsPerSite": 5}'

# Test getting jobs
curl -X GET "http://localhost:3000/jobs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test statistics
curl -X GET http://localhost:3000/jobs/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Expected Results

### Successful Test Output:
```
🚀 Starting Web Scraping Module Tests
✅ Connected to MongoDB for testing
✅ TanitJobs: Found X jobs
✅ LinkedIn: Found X jobs (may be 0 due to blocking)
✅ Combined scraping: Found X total jobs
✅ Saved X jobs to database
📡 API Response (200): {...}
🎉 Web scraping module is working correctly!
```

### Common Issues & Solutions:

1. **LinkedIn returns 0 jobs:**
   - Expected - LinkedIn blocks automated scraping
   - Focus on TanitJobs for testing

2. **Connection timeout:**
   - Check internet connection
   - Try increasing timeout in scraper

3. **Database errors:**
   - Verify MongoDB connection string
   - Check if database is running

4. **Missing dependencies:**
   ```bash
   npm install puppeteer cheerio axios mongoose
   ```

## What Each Test Validates:

1. **Basic Scraping:** Individual scraper functions work
2. **Combined Scraping:** All sources work together
3. **Database Operations:** Jobs save/retrieve correctly
4. **API Endpoints:** Controller functions work properly

## Ready for Integration When:
- ✅ At least TanitJobs scraping works
- ✅ Jobs save to database successfully
- ✅ API endpoints respond correctly
- ✅ No critical errors in test output
