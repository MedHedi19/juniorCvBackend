require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = require('./src/app');
const dbConfig = require('./src/config/db');

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
dbConfig();

// Start the server (for local development)
// Only start server if this file is run directly (not imported)
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT}`);
    });
}   

// Export for Vercel
module.exports = app;
