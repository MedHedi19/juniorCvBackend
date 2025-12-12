const mongoose = require('mongoose');

const connectDB = async () => {
    if (process.env.NODE_ENV === 'test') {
        console.log('MongoDB connection skipped in test environment');
        return;
    }
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;