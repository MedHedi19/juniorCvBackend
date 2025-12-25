const mongoose = require('mongoose');

const connectDB = async () => {
    if (process.env.NODE_ENV === 'test') {
        console.log('MongoDB connection skipped in test environment');
        return;
    }
    try {
        const uri = process.env.MONGODB_URI;
        console.log('🔌 Connecting to MongoDB:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
        
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        const dbName = mongoose.connection.db.databaseName;
        console.log('✅ MongoDB connected successfully to database:', dbName);
        
        // Log database stats
        const stats = await mongoose.connection.db.stats();
        console.log('📊 Database stats:', {
            collections: stats.collections,
            dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
            storageSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`
        });
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;