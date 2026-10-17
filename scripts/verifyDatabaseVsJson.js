require('dotenv').config();
const mongoose = require('mongoose');
const QuizModule = require('../src/models/quizModule');
const fs = require('fs');
const path = require('path');

// Load JSON files
function load7PJsonFiles() {
  const dirPath = path.join(__dirname, '../src/data/7P');
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
  const jsonData = {};
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const order = parseInt(file.replace('q', '').replace('.json', ''), 10);
    jsonData[order] = data;
  });
  
  return jsonData;
}

// Compare two localized text objects
function compareLocalizedText(dbText, jsonText, fieldPath) {
  const differences = [];
  
  if (!dbText || !jsonText) {
    differences.push(`${fieldPath}: One is missing`);
    return differences;
  }
  
  // Only compare existing languages in database (fr, en, ar)
  // Ignore new languages (de, esp, it) that haven't been added yet
  const existingLanguages = ['fr', 'en', 'ar'];
  
  existingLanguages.forEach(lang => {
    if (dbText[lang] !== jsonText[lang]) {
      differences.push(`${fieldPath}.${lang}: DB="${dbText[lang]}" vs JSON="${jsonText[lang]}"`);
    }
  });
  
  return differences;
}

// Compare a question from DB with JSON
function compareQuestion(dbQuestion, jsonQuestion, questionIndex) {
  const differences = [];
  
  // Compare question text
  const questionDiffs = compareLocalizedText(dbQuestion.question, jsonQuestion.question, `question[${questionIndex}].question`);
  differences.push(...questionDiffs);
  
  // Compare options
  if (dbQuestion.options.length !== jsonQuestion.options.length) {
    differences.push(`question[${questionIndex}].options: Different count - DB:${dbQuestion.options.length} vs JSON:${jsonQuestion.options.length}`);
  } else {
    dbQuestion.options.forEach((dbOption, optIndex) => {
      const jsonOption = jsonQuestion.options[optIndex];
      const optDiffs = compareLocalizedText(dbOption, jsonOption, `question[${questionIndex}].options[${optIndex}]`);
      differences.push(...optDiffs);
    });
  }
  
  // Compare correct answer
  const correctDiffs = compareLocalizedText(dbQuestion.correct, jsonQuestion.correct, `question[${questionIndex}].correct`);
  differences.push(...correctDiffs);
  
  return differences;
}

// Compare a quiz module from DB with JSON
function compareQuizModule(dbModule, jsonData, order) {
  const differences = [];
  
  const jsonModule = jsonData[order];
  if (!jsonModule) {
    differences.push(`Module order ${order} exists in DB but not in JSON files`);
    return differences;
  }
  
  // Get the category key (e.g., "Paperwork")
  const categoryKey = Object.keys(jsonModule)[0];
  const jsonQuestions = jsonModule[categoryKey];
  
  if (dbModule.questions.length !== jsonQuestions.length) {
    differences.push(`Module order ${order}: Different question count - DB:${dbModule.questions.length} vs JSON:${jsonQuestions.length}`);
  }
  
  const maxQuestions = Math.max(dbModule.questions.length, jsonQuestions.length);
  
  for (let i = 0; i < maxQuestions; i++) {
    const dbQuestion = dbModule.questions[i];
    const jsonQuestion = jsonQuestions[i];
    
    if (!dbQuestion || !jsonQuestion) {
      differences.push(`Module order ${order}, question ${i}: Missing in one source`);
      continue;
    }
    
    const questionDiffs = compareQuestion(dbQuestion, jsonQuestion, i);
    differences.push(...questionDiffs);
  }
  
  return differences;
}

async function verifyDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/juniorcv');
    console.log('✓ Connected to database\n');
    
    // Load JSON files
    console.log('Loading JSON files...');
    const jsonData = load7PJsonFiles();
    console.log(`✓ Loaded ${Object.keys(jsonData).length} JSON files\n`);
    
    // Fetch quiz modules from database
    console.log('Fetching quiz modules from database...');
    const dbModules = await QuizModule.find({}).sort({ order: 1 });
    console.log(`✓ Found ${dbModules.length} quiz modules in database\n`);
    
    // Compare each	module
    console.log('='.repeat(80));
    console.log('COMPARISON REPORT');
    console.log('='.repeat(80));
    console.log();
    
    let totalDifferences = 0;
    let modulesWithDifferences = 0;
    
    for (const dbModule of dbModules) {
      const order = dbModule.order;
      console.log(`\n--- Module: ${dbModule.slug} (Order: ${order}) ---`);
      
      const differences = compareQuizModule(dbModule, jsonData, order);
      
      if (differences.length === 0) {
        console.log('✓ No differences found - Database matches JSON files');
      } else {
        modulesWithDifferences++;
        totalDifferences += differences.length;
        console.log(`⚠ Found ${differences.length} difference(s):`);
        differences.forEach(diff => console.log(`  - ${diff}`));
      }
    }
    
    console.log();
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total modules checked: ${dbModules.length}`);
    console.log(`Modules with differences: ${modulesWithDifferences}`);
    console.log(`Total differences found: ${totalDifferences}`);
    
    if (totalDifferences === 0) {
      console.log('\n✅ Database is in sync with JSON files');
      console.log('Safe to proceed with migration.');
    } else {
      console.log('\n⚠️  Database has modifications that differ from JSON files');
      console.log('Review the differences above before proceeding.');
      console.log('\nOptions:');
      console.log('1. If admin changes should be kept: Update JSON files to match database');
      console.log('2. If JSON files are correct: Re-import JSON files to database');
      console.log('3. Manual review and merge of changes');
    }
    
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from database');
    
  } catch (error) {
    console.error('Error during verification:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run verification
console.log('Verifying database against JSON files...\n');
verifyDatabase();
