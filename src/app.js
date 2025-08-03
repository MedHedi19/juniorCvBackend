const express = require('express');
const bodyParser = require('body-parser');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const dbConfig = require('./config/db');
const cors = require('cors');
const app = express();
const quizRoutes = require('./routes/quizRoutes');
const documentRoutes = require('./routes/documents');
const personalityRoutes = require('./routes/personalityRoutes');

// CORS Configuration
const corsOptions = {
    origin: [
        'http://localhost:8081', 
        'http://127.0.0.1:8081',
        'https://rvtzs3o-arselaapp-8081.exp.direct',
        'http://192.168.0.9:8081',
        'exp://192.168.0.9:8081'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' })); // Increase limit for file uploads
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
dbConfig();

// Root route for health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Junior CV Backend API is running!', 
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/quiz', quizRoutes);
app.use('/documents', documentRoutes);
app.use('/personality', personalityRoutes);

// Error handling middleware
app.use(errorHandler);

module.exports = app;
