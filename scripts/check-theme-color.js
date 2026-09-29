const fs = require('fs');
const path = require('path');

const filesToCheck = ['index.html', 'privacy.html'];
const searchString = '<meta name="theme-color" content="#0a0e17"';
let allPassed = true;

for (const file of filesToCheck) {
  const filePath = path.join(__dirname, '..', file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(searchString)) {
      console.log(`✅ ${file} contains theme-color meta tag.`);
    } else {
      console.error(`❌ ${file} is missing the theme-color meta tag or it is not formatted exactly as expected.`);
      allPassed = false;
    }
  } catch (err) {
    console.error(`❌ Error reading ${file}: ${err.message}`);
    allPassed = false;
  }
}

if (!allPassed) {
  process.exit(1);
} else {
  console.log('✅ All theme-color checks passed.');
}
