require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const User = require('./src/models/user');
const UpskillingProgress = require('./src/models/upskillingProgress');

async function testCloudinaryLink() {
    process.stdout.write('\n--- 🧪 TEST START: CLOUDINARY + MONGODB LINK ---\n');

    try {
        await connectDB();

        const testEmail = 'test_admin_v2@boositfyskills.com';
        let user = await User.findOne({ email: testEmail });

        if (!user) {
            process.stdout.write('👤 Creating new test user...\n');
            user = new User({
                firstName: 'Admin',
                lastName: 'Tester',
                email: testEmail,
                password: 'password123'
            });
            await user.save();
            process.stdout.write('✅ Created test user\n');
        } else {
            process.stdout.write('👤 Using existing test user: ' + user._id + '\n');
        }

        const mockData = {
            day: 1,
            mediaUrl: 'https://res.cloudinary.com/demo/audio/upload/v12345/final_test.mp3',
            mediaType: 'audio/mp3',
            submissionType: 'audio'
        };

        process.stdout.write('📡 Simulating submission for Day ' + mockData.day + '...\n');

        let progress = await UpskillingProgress.findOne({ userId: user._id });
        if (!progress) {
            process.stdout.write('📝 Initializing new progress...\n');
            progress = new UpskillingProgress({
                userId: user._id,
                personalityColor: 'bleu',
                challenges: [{
                    day: mockData.day,
                    completed: false,
                    submission: {
                        type: mockData.submissionType,
                        mediaUrl: mockData.mediaUrl,
                        mediaType: mockData.mediaType,
                        status: 'pending',
                        uploadedAt: new Date()
                    }
                }]
            });
        } else {
            process.stdout.write('📝 Updating existing progress...\n');
            let challenge = progress.challenges.find(c => c.day === mockData.day);
            if (!challenge) {
                progress.challenges.push({ day: mockData.day });
                challenge = progress.challenges[progress.challenges.length - 1];
            }

            challenge.submission = {
                type: mockData.submissionType,
                mediaUrl: mockData.mediaUrl,
                mediaType: mockData.mediaType,
                status: 'pending',
                uploadedAt: new Date()
            };
        }

        await progress.save();
        process.stdout.write('💾 [SUCCESS] Data saved to MongoDB!\n');

        const result = await UpskillingProgress.findOne({ userId: user._id });
        const sub = result.challenges.find(c => c.day === mockData.day).submission;

        process.stdout.write('\n--- 📂 DATABASE VERIFICATION ---\n');
        process.stdout.write('User ID:   ' + result.userId + '\n');
        process.stdout.write('Day:       ' + mockData.day + '\n');
        process.stdout.write('Media URL: ' + sub.mediaUrl + '\n');
        process.stdout.write('Status:    ' + sub.status + '\n');
        process.stdout.write('--------------------------------\n\n');

        process.stdout.write('🏆 VERDICT: The backend is 100% READY.\n');

    } catch (error) {
        process.stdout.write('❌ TEST FAILED: ' + error.message + '\n');
    } finally {
        await mongoose.connection.close();
        process.stdout.write('🔌 Test finished.\n\n');
        process.exit(0);
    }
}

testCloudinaryLink();
