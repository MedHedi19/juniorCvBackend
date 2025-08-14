const JobApplication = require('../models/jobApplication');
const Job = require('../models/job');
const mongoose = require('mongoose');

// Apply to a job
const applyToJob = async (req, res) => {
    try {
        const { jobId, notes, coverLetter, applicationMethod = 'direct_link' } = req.body;
        const userId = req.user.id;

        if (!jobId) {
            return res.status(400).json({ message: 'Job ID is required' });
        }

        // Check if job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Check if user already applied to this job
        const existingApplication = await JobApplication.findOne({ userId, jobId });
        if (existingApplication) {
            return res.status(409).json({ 
                message: 'You have already applied to this job',
                applicationId: existingApplication._id,
                appliedAt: existingApplication.appliedAt
            });
        }

        // Create job snapshot
        const jobSnapshot = {
            title: job.title,
            company: job.company,
            location: job.location,
            link: job.link,
            source: job.source,
            description: job.description,
            salary: job.salary,
            jobType: job.jobType
        };

        // Create application
        const application = new JobApplication({
            userId,
            jobId,
            jobSnapshot,
            notes,
            coverLetter,
            applicationMethod
        });

        const savedApplication = await application.save();

        res.status(201).json({
            message: 'Application submitted successfully',
            application: savedApplication
        });

    } catch (error) {
        console.error('Apply to job error:', error);
        res.status(500).json({ 
            message: 'Error submitting application', 
            error: error.message 
        });
    }
};

// Get user's job applications with pagination and filtering
const getUserApplications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            status, 
            page = 1, 
            limit = 20,
            sortBy = 'appliedAt',
            sortOrder = 'desc',
            company,
            searchTerm
        } = req.query;

        const filter = { userId, isActive: true };

        if (status) {
            filter.status = status;
        }

        if (company) {
            filter['jobSnapshot.company'] = { $regex: company, $options: 'i' };
        }

        if (searchTerm) {
            filter.$or = [
                { 'jobSnapshot.title': { $regex: searchTerm, $options: 'i' } },
                { 'jobSnapshot.company': { $regex: searchTerm, $options: 'i' } },
                { 'jobSnapshot.description': { $regex: searchTerm, $options: 'i' } }
            ];
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const skip = (page - 1) * limit;

        const applications = await JobApplication.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('jobId', 'title company location link isActive')
            .lean();

        const total = await JobApplication.countDocuments(filter);

        res.status(200).json({
            applications,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalApplications: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ 
            message: 'Error fetching applications', 
            error: error.message 
        });
    }
};

// Get application statistics for user
const getApplicationStatistics = async (req, res) => {
    try {
        const userId = req.user.id;

        const stats = await JobApplication.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
            {
                $group: {
                    _id: null,
                    totalApplications: { $sum: 1 },
                    statusBreakdown: {
                        $push: '$status'
                    },
                    companies: { $addToSet: '$jobSnapshot.company' },
                    sources: { $addToSet: '$jobSnapshot.source' }
                }
            }
        ]);

        // Count by status
        const statusCounts = await JobApplication.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Recent applications
        const recentApplications = await JobApplication.find({ 
            userId, 
            isActive: true 
        })
            .sort({ appliedAt: -1 })
            .limit(5)
            .select('jobSnapshot.title jobSnapshot.company status appliedAt')
            .lean();

        const overview = stats[0] || {
            totalApplications: 0,
            companies: [],
            sources: []
        };

        res.status(200).json({
            overview: {
                ...overview,
                totalCompanies: overview.companies.length,
                totalSources: overview.sources.length
            },
            statusBreakdown: statusCounts,
            recentApplications
        });

    } catch (error) {
        console.error('Application statistics error:', error);
        res.status(500).json({ 
            message: 'Error fetching application statistics', 
            error: error.message 
        });
    }
};

// Update application status
const updateApplicationStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status, notes } = req.body;
        const userId = req.user.id;

        const validStatuses = ['applied', 'viewed', 'interview_scheduled', 'interview_completed', 'rejected', 'accepted', 'withdrawn'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const application = await JobApplication.findOne({ 
            _id: applicationId, 
            userId 
        });

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        application.status = status;
        if (notes) {
            application.notes = notes;
        }

        const updatedApplication = await application.save();

        res.status(200).json({
            message: 'Application status updated successfully',
            application: updatedApplication
        });

    } catch (error) {
        console.error('Update application status error:', error);
        res.status(500).json({ 
            message: 'Error updating application status', 
            error: error.message 
        });
    }
};

// Delete/withdraw application
const withdrawApplication = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const userId = req.user.id;

        const application = await JobApplication.findOne({ 
            _id: applicationId, 
            userId 
        });

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        application.status = 'withdrawn';
        application.isActive = false;
        
        await application.save();

        res.status(200).json({
            message: 'Application withdrawn successfully'
        });

    } catch (error) {
        console.error('Withdraw application error:', error);
        res.status(500).json({ 
            message: 'Error withdrawing application', 
            error: error.message 
        });
    }
};

module.exports = {
    applyToJob,
    getUserApplications,
    getApplicationStatistics,
    updateApplicationStatus,
    withdrawApplication
};
