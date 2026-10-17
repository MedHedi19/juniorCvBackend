require('dotenv').config();
const mongoose = require('mongoose');
const QuizModule = require('../src/models/quizModule');

const NEW_LANGUAGES = ['de', 'esp', 'it'];
const FALLBACK_LANGUAGE = 'en';

// Function to add new language fields to a localized text object
function addNewLanguagesToText(textObj) {
  if (!textObj || typeof textObj !== 'object') return textObj;
  
  const fallbackText = textObj[FALLBACK_LANGUAGE] || textObj['fr'] || '';
  
  NEW_LANGUAGES.forEach(lang => {
    if (!textObj[lang]) {
      textObj[lang] = fallbackText;
    }
  });
  
  return textObj;
}

// Function to migrate a single quiz module
function migrateQuizModule(quizModule) {
  let updated = false;
  
  // Migrate questions
  if (quizModule.questions && Array.isArray(quizModule.questions)) {
    quizModule.questions.forEach(question => {
      // Migrate question text
      if (question.question) {
        const originalQuestion = JSON.stringify(question.question);
        question.question = addNewLanguagesToText(question.question);
        if (JSON.stringify(question.question) !== originalQuestion) {
          updated = true;
        }
      }
      
      // Migrate options
      if (question.options && Array.isArray(question.options)) {
        question.options.forEach(option => {
          const originalOption = JSON.stringify(option);
          const newOption = addNewLanguagesToText(option);
          Object.assign(option, newOption);
          if (JSON.stringify(option) !== originalOption) {
            updated = true;
          }
        });
      }
      
      // Migrate correct answer
      if (question.correct) {
        const originalCorrect = JSON.stringify(question.correct);
        question.correct = addNewLanguagesToText(question.correct);
        if (JSON.stringify(question.correct) !== originalCorrect) {
          updated = true;
        }
      }
    });
  }
  
  return updated;
}

async function migrateDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/juniorcv');
    console.log('✓ Connected to database\n');
    
    // Find all quiz modules
    console.log('Fetching quiz modules...');
    const quizModules = await QuizModule.find({});
    console.log(`Found ${quizModules.length} quiz modules\n`);
    
    if (quizModules.length === 0) {
      console.log('No quiz modules found in database. Nothing to migrate.');
      await mongoose.disconnect();
      return;
    }
    
    // Migrate each quiz module
    let updatedCount = 0;
    for (const quizModule of quizModules) {
      const wasUpdated = migrateQuizModule(quizModule);
      if (wasUpdated) {
        await quizModule.save();
        updatedCount++;
        console.log(`✓ Updated quiz module: ${quizModule.slug} (order: ${quizModule.order})`);
      } else {
        console.log(`- Skipped quiz module: ${quizModule.slug} (already has new languages)`);
      }
    }
    
    console.log(`\n✅ Migration completed!`);
    console.log(`Updated ${updatedCount} out of ${quizModules.length} quiz modules.`);
    
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from database');
    
  } catch (error) {
    console.error('Error during migration:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
console.log('Starting migration for new languages (de, esp, it)...');
console.log('Using English as fallback for translations.\n');
migrateDatabase();
