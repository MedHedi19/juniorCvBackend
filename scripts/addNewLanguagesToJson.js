const fs = require('fs');
const path = require('path');

const NEW_LANGUAGES = ['de', 'esp', 'it'];
const FALLBACK_LANGUAGE = 'en';

// Function to add new language fields to a localized text object
function addNewLanguages(textObj) {
  if (!textObj || typeof textObj !== 'object') return textObj;
  
  const fallbackText = textObj[FALLBACK_LANGUAGE] || textObj['fr'] || '';
  
  NEW_LANGUAGES.forEach(lang => {
    if (!textObj[lang]) {
      textObj[lang] = fallbackText;
    }
  });
  
  return textObj;
}

// Process 7P quiz files
function process7PFiles() {
  const dirPath = path.join(__dirname, '../src/data/7P');
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    console.log(`Processing ${file}...`);
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Process each category in the file
    Object.keys(data).forEach(category => {
      data[category].forEach(item => {
        // Add new languages to question
        if (item.question) {
          item.question = addNewLanguages(item.question);
        }
        
        // Add new languages to options
        if (item.options && Array.isArray(item.options)) {
          item.options = item.options.map(opt => addNewLanguages(opt));
        }
        
        // Add new languages to correct answer
        if (item.correct) {
          item.correct = addNewLanguages(item.correct);
        }
      });
    });
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✓ Updated ${file}`);
  });
}

// Process personality test file
function processPersonalityFile() {
  const filePath = path.join(__dirname, '../src/data/personality/personality-test.json');
  console.log('Processing personality-test.json...');
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  Object.keys(data).forEach(testName => {
    data[testName].forEach(item => {
      // Add new languages to question
      if (item.question) {
        item.question = addNewLanguages(item.question);
      }
      
      // Add new languages to options
      if (item.options && typeof item.options === 'object') {
        Object.keys(item.options).forEach(color => {
          item.options[color] = addNewLanguages(item.options[color]);
        });
      }
    });
  });
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log('✓ Updated personality-test.json');
}

// Process VARK test file
function processVarkFile() {
  const filePath = path.join(__dirname, '../src/data/vark/vark.json');
  console.log('Processing vark.json...');
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (data.VARK && Array.isArray(data.VARK)) {
    data.VARK.forEach(item => {
      // Add new languages to question
      if (item.question) {
        item.question = addNewLanguages(item.question);
      }
      
      // Add new languages to options
      if (item.options && typeof item.options === 'object') {
        Object.keys(item.options).forEach(style => {
          item.options[style] = addNewLanguages(item.options[style]);
        });
      }
    });
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log('✓ Updated vark.json');
}

// Process upskilling files
function processUpskillingFiles() {
  const dirPath = path.join(__dirname, '../src/data/upskilling');
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json') || f.endsWith('.jsonc'));
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    console.log(`Processing ${file}...`);
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Upskilling files have a different structure: { color, challenges: [...] }
    if (data.challenges && Array.isArray(data.challenges)) {
      data.challenges.forEach(item => {
        // Add new languages to intro
        if (item.intro) {
          item.intro = addNewLanguages(item.intro);
        }
        
        // Add new languages to proverb
        if (item.proverb) {
          item.proverb = addNewLanguages(item.proverb);
        }
        
        // Add new languages to challenge
        if (item.challenge) {
          item.challenge = addNewLanguages(item.challenge);
        }
      });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✓ Updated ${file}`);
  });
}

// Main execution
console.log('Adding new language fields (de, esp, it) to JSON files...');
console.log('Using English as fallback for translations.\n');

try {
  process7PFiles();
  processPersonalityFile();
  processVarkFile();
  processUpskillingFiles();
  
  console.log('\n✅ All JSON files updated successfully!');
  console.log('\n⚠️  IMPORTANT: The new language fields have been populated with English text as a placeholder.');
  console.log('You should manually review and update the translations for de, esp, and it in the JSON files.');
  console.log('After updating the JSON files, run the migration script to update the database.');
} catch (error) {
  console.error('Error processing files:', error);
  process.exit(1);
}
