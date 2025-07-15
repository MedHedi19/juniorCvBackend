require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = require('./src/app');
const dbConfig = require('./src/config/db');
const uploadRoute = require('./src/routes/profile');
const cors = require('cors');

const PORT = process.env.PORT || 3000;

app.use('/uploads', express.static('uploads')); 




// Connect to MongoDB
dbConfig();

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});