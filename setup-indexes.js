// Script to set up all required indexes for the User model
// Run this when your MongoDB connection is working

const mongoose = require('mongoose');
require('dotenv').config();

async function setupIndexes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        const collection = db.collection('users');
        
        // List current indexes
        console.log('\n📋 Current indexes:');
        const currentIndexes = await collection.indexes();
        currentIndexes.forEach(index => {
            console.log(`- ${index.name}: ${JSON.stringify(index.key)} (unique: ${index.unique}, sparse: ${index.sparse})`);
        });
        
        // Drop problematic indexes if they exist
        const indexesToDrop = ['phone_1', 'socialAuth.googleId_1', 'socialAuth.facebookId_1', 'socialAuth.linkedinId_1'];
        
        for (const indexName of indexesToDrop) {
            try {
                await collection.dropIndex(indexName);
                console.log(`✅ Dropped ${indexName} index`);
            } catch (error) {
                if (error.code === 27) {
                    console.log(`ℹ️  ${indexName} index does not exist`);
                } else {
                    console.log(`⚠️  Error dropping ${indexName}: ${error.message}`);
                }
            }
        }
        
        // Create new sparse unique indexes
        const indexesToCreate = [
            { field: { phone: 1 }, options: { sparse: true, unique: true } },
            { field: { 'socialAuth.googleId': 1 }, options: { sparse: true, unique: true } },
            { field: { 'socialAuth.facebookId': 1 }, options: { sparse: true, unique: true } },
            { field: { 'socialAuth.linkedinId': 1 }, options: { sparse: true, unique: true } }
        ];
        
        for (const { field, options } of indexesToCreate) {
            try {
                await collection.createIndex(field, options);
                console.log(`✅ Created index on ${JSON.stringify(field)}`);
            } catch (error) {
                console.log(`❌ Error creating index on ${JSON.stringify(field)}: ${error.message}`);
            }
        }
        
        // Show final indexes
        console.log('\n🎯 Final indexes:');
        const finalIndexes = await collection.indexes();
        finalIndexes.forEach(index => {
            console.log(`- ${index.name}: ${JSON.stringify(index.key)} (unique: ${index.unique}, sparse: ${index.sparse})`);
        });
        
        console.log('\n🎉 All indexes set up successfully!');
        console.log('Google OAuth login should now work without duplicate key errors.');
        
    } catch (error) {
        console.error('❌ Error setting up indexes:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

setupIndexes();

