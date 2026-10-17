require('dotenv').config();
const mongoose = require('mongoose');
const QuizModule = require('../src/models/quizModule');
const fs = require('fs');
const path = require('path');

// Function to update 7P JSON files from database
async function sync7PJsonFiles() {
  const dirPath = path.join(__dirname, '../src/data/7P');
  
  // Fetch all quiz modules from database
  const dbModules = await QuizModule.find({}).sort({ order: 1 });
  
  for (const dbModule of dbModules) {
    const order = dbModule.order;
    const filePath = path.join(dirPath, `q${order}.json`);
    
    console.log(`Syncing q${order}.json from database...`);
    
    // Determine category name from existing JSON or use a default
    let categoryName = 'Paperwork';
    if (fs.existsSync(filePath)) {
      const existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      categoryName = Object.keys(existingData)[0];
    }
    
    // Build JSON structure from database
    const jsonData = {};
    jsonData[categoryName] = dbModule.questions.map(q => ({
      question: q.question,
      options: q.options,
      correct: q.correct
    }));
    
    // Write to JSON file
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log(`✓ Updated q${order}.json`);
  }
}

async function syncDatabaseToJson() {
  try {
    // Connect to MongoDB
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/juniorcv');
    console.log('✓ Connected to database\n');
    
    // Sync 7P quiz files
    console.log('Syncing 7P JSON files from database...');
    await sync7PJsonFiles();
    
    console.log('\n✅ All JSON files synced with database successfully!');
    console.log('The admin changes are now preserved in the JSON files.');
    
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from database');
    
  } catch (error) {
    console.error('Error during sync:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run sync
console.log('Syncing JSON files with database content...\n');
syncDatabaseToJson();
