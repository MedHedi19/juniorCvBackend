const express = require('express');
const bodyParser = require('body-parser');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const dbConfig = require('./config/db');
const cors = require('cors');
const app = express();
const quizRoutes = require('./routes/quizRoutes');
const personalityRoutes = require('./routes/personalityRoutes');
const jobScrapingRoutes = require('./routes/jobScraping');
const jobApplicationRoutes = require('./routes/jobApplications');

// Initialize Passport
require('./config/passport')(app);

// CORS Configuration - More permissive for development
const corsOptions = {
    origin: true, // Allow all origins during development
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' })); // Reduced limit since no file uploads
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        auth: {
            googleAuth: !!process.env.GOOGLE_CLIENT_ID,
            facebookAuth: !!process.env.FACEBOOK_APP_ID,
            linkedinAuth: !!process.env.LINKEDIN_CLIENT_ID
        }
    });
});

// Database connection
dbConfig();

// Root route for health check
app.get('/', (req, res) => {
    res.status(200).json({ 
        message: 'Junior CV Backend API is running successfully!', 
        version: '1.0.1',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/auth',
            profile: '/profile',
            quiz: '/quiz',
            personality: '/personality',
            jobs: '/jobs',
            applications: '/applications'
        }
    });
});

// Routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/quiz', quizRoutes);
app.use('/personality', personalityRoutes);
app.use('/jobs', jobScrapingRoutes);
app.use('/applications', jobApplicationRoutes);

// Error handling middleware
app.use(errorHandler);

module.exports = app;
