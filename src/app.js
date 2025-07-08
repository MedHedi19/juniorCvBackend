const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const dbConfig = require('./config/db');
const cors = require('cors');
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Database connection
dbConfig();

// Routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);

// Error handling middleware
app.use(errorHandler);

module.exports = app;