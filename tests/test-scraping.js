require('dotenv').config();
const mongoose = require('mongoose');
const JobScraper = require('./src/scrapers/jobScraper');
const Job = require('./src/models/job');

// Test configuration
const TEST_CONFIG = {
    searchTerm: 'developer',
    location: 'Tunisia',
    maxJobsPerSite: 5
};

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/juniorCV-test');
        console.log('✅ Connected to MongoDB for testing');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
}

// Test 1: Basic scraper functionality
async function testBasicScraping() {
    console.log('\n🧪 Test 1: Basic Scraping Functionality');
    console.log('=====================================');
    
    const scraper = new JobScraper();
    
    try {
        // Test TanitJobs scraping (usually more reliable)
        console.log('Testing TanitJobs scraping...');
        const tanitJobs = await scraper.scrapeTanitJobs(TEST_CONFIG.searchTerm, 3);
        console.log(`✅ TanitJobs: Found ${tanitJobs.length} jobs`);
        
        if (tanitJobs.length > 0) {
            console.log('Sample job:', {
                title: tanitJobs[0].title,
                company: tanitJobs[0].company,
                source: tanitJobs[0].source
            });
        }
        
        // Test LinkedIn scraping (may be blocked)
        console.log('\nTesting LinkedIn scraping...');
        const linkedInJobs = await scraper.scrapeLinkedInJobs(TEST_CONFIG.searchTerm, TEST_CONFIG.location, 3);
        console.log(`✅ LinkedIn: Found ${linkedInJobs.length} jobs`);
        
        if (linkedInJobs.length > 0) {
            console.log('Sample job:', {
                title: linkedInJobs[0].title,
                company: linkedInJobs[0].company,
                source: linkedInJobs[0].source
            });
        }
        
        return { tanitJobs, linkedInJobs };
        
    } catch (error) {
        console.error('❌ Basic scraping test failed:', error.message);
        return { tanitJobs: [], linkedInJobs: [] };
    }
}

// Test 2: Combined scraping
async function testCombinedScraping() {
    console.log('\n🧪 Test 2: Combined Scraping');
    console.log('============================');
    
    const scraper = new JobScraper();
    
    try {
        const allJobs = await scraper.scrapeAllJobs(
            TEST_CONFIG.searchTerm, 
            TEST_CONFIG.location, 
            TEST_CONFIG.maxJobsPerSite
        );
        
        console.log(`✅ Combined scraping: Found ${allJobs.length} total jobs`);
        
        // Group by source
        const jobsBySource = allJobs.reduce((acc, job) => {
            acc[job.source] = (acc[job.source] || 0) + 1;
            return acc;
        }, {});
        
        console.log('Jobs by source:', jobsBySource);
        
        return allJobs;
        
    } catch (error) {
        console.error('❌ Combined scraping test failed:', error.message);
        return [];
    }
}

// Test 3: Database operations
async function testDatabaseOperations(jobs) {
    console.log('\n🧪 Test 3: Database Operations');
    console.log('===============================');
    
    try {
        // Clear test data first
        await Job.deleteMany({ searchTerm: TEST_CONFIG.searchTerm });
        console.log('🧹 Cleared existing test data');
        
        // Save jobs to database
        const savedJobs = [];
        const errors = [];
        
        for (const jobData of jobs) {
            try {
                const job = new Job({
                    ...jobData,
                    searchTerm: TEST_CONFIG.searchTerm
                });
                
                const savedJob = await job.save();
                savedJobs.push(savedJob);
                
            } catch (error) {
                if (error.code === 11000) {
                    console.log(`⚠️  Duplicate job skipped: ${jobData.title}`);
                } else {
                    errors.push({
                        job: jobData.title,
                        error: error.message
                    });
                }
            }
        }
        
        console.log(`✅ Saved ${savedJobs.length} jobs to database`);
        console.log(`⚠️  ${errors.length} errors encountered`);
        
        if (errors.length > 0) {
            console.log('Errors:', errors);
        }
        
        // Test retrieval
        const retrievedJobs = await Job.find({ searchTerm: TEST_CONFIG.searchTerm });
        console.log(`✅ Retrieved ${retrievedJobs.length} jobs from database`);
        
        return { savedJobs, errors, retrievedJobs };
        
    } catch (error) {
        console.error('❌ Database operations test failed:', error.message);
        return { savedJobs: [], errors: [error], retrievedJobs: [] };
    }
}

// Test 4: API endpoints simulation
async function testAPIEndpoints() {
    console.log('\n🧪 Test 4: API Endpoints Simulation');
    console.log('===================================');
    
    try {
        // Simulate controller functions
        const { scrapeAndSaveJobs, getScrapedJobs, getJobStatistics } = require('./src/controllers/jobScrapingController');
        
        // Mock request and response objects
        const mockReq = {
            body: {
                searchTerm: 'javascript',
                location: 'Tunisia',
                maxJobsPerSite: 3
            },
            query: {
                page: 1,
                limit: 10
            }
        };
        
        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    console.log(`📡 API Response (${code}):`, JSON.stringify(data, null, 2));
                    return data;
                }
            })
        };
        
        console.log('Testing scrapeAndSaveJobs endpoint...');
        await scrapeAndSaveJobs(mockReq, mockRes);
        
        console.log('\nTesting getScrapedJobs endpoint...');
        await getScrapedJobs(mockReq, mockRes);
        
        console.log('\nTesting getJobStatistics endpoint...');
        await getJobStatistics(mockReq, mockRes);
        
        console.log('✅ API endpoints simulation completed');
        
    } catch (error) {
        console.error('❌ API endpoints test failed:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Web Scraping Module Tests');
    console.log('======================================');
    
    try {
        // Connect to database
        await connectDB();
        
        // Run tests in sequence
        const { tanitJobs, linkedInJobs } = await testBasicScraping();
        const allJobs = await testCombinedScraping();
        const dbResults = await testDatabaseOperations(allJobs);
        await testAPIEndpoints();
        
        // Summary
        console.log('\n📊 Test Summary');
        console.log('===============');
        console.log(`✅ TanitJobs: ${tanitJobs.length} jobs`);
        console.log(`✅ LinkedIn: ${linkedInJobs.length} jobs`);
        console.log(`✅ Combined: ${allJobs.length} jobs`);
        console.log(`✅ Saved to DB: ${dbResults.savedJobs.length} jobs`);
        console.log(`⚠️  DB Errors: ${dbResults.errors.length}`);
        
        if (allJobs.length > 0) {
            console.log('\n🎉 Web scraping module is working correctly!');
            console.log('You can now integrate it into your main application.');
        } else {
            console.log('\n⚠️  No jobs were scraped. Check your internet connection and website accessibility.');
        }
        
    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
    } finally {
        // Cleanup
        console.log('\n🧹 Cleaning up...');
        await Job.deleteMany({ searchTerm: TEST_CONFIG.searchTerm });
        await mongoose.disconnect();
        console.log('✅ Cleanup completed');
        process.exit(0);
    }
}

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});

// Run tests
runAllTests();
