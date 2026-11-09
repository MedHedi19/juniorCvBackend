const mongoose = require('mongoose');
const User = require('../src/models/user');
const UpskillingProgress = require('../src/models/upskillingProgress');

require('dotenv').config();

const DAYS_TO_REMOVE = [3];
const USER_EMAIL = 'bensalahm99@gmail.com';

async function removeSubmissions() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log(`🔍 Finding user: ${USER_EMAIL}`);
        const user = await User.findOne({ email: USER_EMAIL });
        
        if (!user) {
            console.error('❌ User not found');
            process.exit(1);
        }

        console.log(`✅ User found: ${user._id}`);

        let progress = await UpskillingProgress.findOne({ userId: user._id });
        
        if (!progress) {
            console.error('❌ UpskillingProgress not found');
            process.exit(1);
        }

        console.log(`📊 Current progress: ${progress.challenges.length} challenges`);

        let modified = false;

        for (const day of DAYS_TO_REMOVE) {
            const challengeIndex = day - 1;
            
            if (challengeIndex >= 0 && challengeIndex < progress.challenges.length) {
                const challenge = progress.challenges[challengeIndex];
                
                console.log(`\n📅 Day ${day}:`);
                console.log(`   Current state:`, {
                    completed: challenge.completed,
                    type: challenge.submission?.type,
                    hasMedia: !!challenge.submission?.mediaUrl
                });

                if (challenge.completed) {
                    // Reset the challenge
                    challenge.completed = false;
                    challenge.completedAt = null;
                    challenge.submission = {
                        type: 'none',
                        content: null,
                        mediaUrl: null
                    };
                    
                    console.log(`   ✅ Day ${day} reset to incomplete`);
                    modified = true;
                } else {
                    console.log(`   ℹ️  Day ${day} already incomplete`);
                }
            } else {
                console.log(`   ⚠️  Day ${day} not found in progress`);
            }
        }

        if (modified) {
            await progress.save();
            console.log('\n✅ Progress saved successfully');
        } else {
            console.log('\nℹ️  No changes needed');
        }

        // Show final state
        console.log('\n📊 Final state for modified days:');
        for (const day of DAYS_TO_REMOVE) {
            const challengeIndex = day - 1;
            if (challengeIndex >= 0 && challengeIndex < progress.challenges.length) {
                const challenge = progress.challenges[challengeIndex];
                console.log(`   Day ${day}: completed=${challenge.completed}, type=${challenge.submission?.type}`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

removeSubmissions();
