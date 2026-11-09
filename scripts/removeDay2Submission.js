require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user');
const UpskillingProgress = require('../src/models/upskillingProgress');

async function removeDay2Submission() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const email = 'bensalahm99@gmail.com';
    console.log(`🔍 Finding user: ${email}`);
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.firstName} ${user.lastName} (ID: ${user._id})`);

    // Find user's progress
    console.log('🔍 Finding upskilling progress...');
    const progress = await UpskillingProgress.findOne({ userId: user._id });

    if (!progress) {
      console.log('❌ No progress found for user');
      process.exit(1);
    }

    console.log(`✅ Found progress with ${progress.challenges.length} challenges`);

    // Find day 2 challenge
    const day2Index = progress.challenges.findIndex(c => c.day === 2);

    if (day2Index === -1) {
      console.log('❌ Day 2 challenge not found');
      process.exit(1);
    }

    const day2Challenge = progress.challenges[day2Index];
    console.log('📋 Current Day 2 status:');
    console.log('  - Completed:', day2Challenge.completed);
    console.log('  - Submission type:', day2Challenge.submission?.type);
    console.log('  - Media URL:', day2Challenge.submission?.mediaUrl);

    // Reset day 2 submission
    console.log('🔄 Resetting Day 2 submission...');
    progress.challenges[day2Index].completed = false;
    progress.challenges[day2Index].completedAt = null;
    progress.challenges[day2Index].submission = {
      type: 'none',
      textContent: null,
      mediaUrl: null,
      mediaType: null,
      uploadedAt: null,
    };

    await progress.save();
    console.log('✅ Day 2 submission removed successfully');

    // Show updated status
    console.log('📋 Updated Day 2 status:');
    console.log('  - Completed:', progress.challenges[day2Index].completed);
    console.log('  - Submission type:', progress.challenges[day2Index].submission?.type);

    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

removeDay2Submission();
