require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = require('./src/app');
const dbConfig = require('./src/config/db');

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
dbConfig();

// Start the server (for local development)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// Export for Vercel
module.exports = app;
