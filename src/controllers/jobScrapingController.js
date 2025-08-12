const JobScraper = require('../scrapers/jobScraper');
const Job = require('../models/job');

const jobScraper = new JobScraper();

const scrapeAndSaveJobs = async (req, res) => {
    try {
        // 从请求体中解构获取搜索词、位置和每站最大职位数，位置默认为突尼斯
        const { searchTerm, location = 'Tunisia', maxJobsPerSite = 10 } = req.body;
        
        // 检查搜索词是否存在，若不存在则返回400错误
        if (!searchTerm) {
            return res.status(400).json({ message: 'Search term is required' });
        }
        
        // 在控制台输出开始爬取职位的日志
        console.log(`Starting job scraping for: ${searchTerm}`);
        
        // Scrape jobs from all sources
        const scrapedJobs = await jobScraper.scrapeAllJobs(searchTerm, location, maxJobsPerSite);
        
        if (scrapedJobs.length === 0) {
            return res.status(404).json({ 
                message: 'No jobs found',
                searchTerm,
                location,
                count: 0
            });
        }
        
        // Save jobs to database
        const savedJobs = [];
        const errors = [];
        
        for (const jobData of scrapedJobs) {
            try {
                const job = new Job({
                    ...jobData,
                    searchTerm
                });
                
                const savedJob = await job.save();
                savedJobs.push(savedJob);
            } catch (error) {
                if (error.code === 11000) {
                    // Duplicate job, skip
                    console.log(`Duplicate job skipped: ${jobData.title} at ${jobData.company}`);
                } else {
                    errors.push({
                        job: jobData.title,
                        error: error.message
                    });
                }
            }
        }
        
        res.status(200).json({
            message: 'Job scraping completed',
            searchTerm,
            location,
            totalScraped: scrapedJobs.length,
            savedJobs: savedJobs.length,
            duplicatesSkipped: scrapedJobs.length - savedJobs.length - errors.length,
            errors: errors.length,
            jobs: savedJobs
        });
        
    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({ 
            message: 'Error during job scraping', 
            error: error.message 
        });
    }
};

// Get scraped jobs from database
const getScrapedJobs = async (req, res) => {
    try {
        const { 
            searchTerm, 
            source, 
            page = 1, 
            limit = 20,
            sortBy = 'scrapedAt',
            sortOrder = 'desc'
        } = req.query;
        
        const filter = { isActive: true };
        
        if (searchTerm) {
            filter.searchTerm = { $regex: searchTerm, $options: 'i' };
        }
        
        if (source) {
            filter.source = source;
        }
        
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const skip = (page - 1) * limit;
        
        const jobs = await Job.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
        
        const total = await Job.countDocuments(filter);
        
        res.status(200).json({
            jobs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalJobs: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
        
    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({ 
            message: 'Error fetching jobs', 
            error: error.message 
        });
    }
};

// Get job statistics
const getJobStatistics = async (req, res) => {
    try {
        const stats = await Job.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    totalJobs: { $sum: 1 },
                    sources: { $addToSet: '$source' },
                    searchTerms: { $addToSet: '$searchTerm' },
                    companies: { $addToSet: '$company' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalJobs: 1,
                    totalSources: { $size: '$sources' },
                    totalSearchTerms: { $size: '$searchTerms' },
                    totalCompanies: { $size: '$companies' },
                    sources: 1
                }
            }
        ]);
        
        const sourceStats = await Job.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$source',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const recentJobs = await Job.find({ isActive: true })
            .sort({ scrapedAt: -1 })
            .limit(5)
            .select('title company source scrapedAt')
            .lean();
        
        res.status(200).json({
            overview: stats[0] || {
                totalJobs: 0,
                totalSources: 0,
                totalSearchTerms: 0,
                totalCompanies: 0,
                sources: []
            },
            sourceBreakdown: sourceStats,
            recentJobs
        });
        
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({ 
            message: 'Error fetching statistics', 
            error: error.message 
        });
    }
};

// Delete old jobs (cleanup)
const cleanupOldJobs = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
        
        const result = await Job.deleteMany({
            scrapedAt: { $lt: cutoffDate }
        });
        
        res.status(200).json({
            message: `Cleanup completed`,
            deletedJobs: result.deletedCount,
            cutoffDate
        });
        
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ 
            message: 'Error during cleanup', 
            error: error.message 
        });
    }
};

module.exports = {
    scrapeAndSaveJobs,
    getScrapedJobs,
    getJobStatistics,
    cleanupOldJobs
};
