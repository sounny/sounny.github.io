const fs = require('fs');
const path = require('path');

const filesToCheck = ['index.html', 'privacy.html'];
const inlineEventRegex = /\bon[a-z]+\s*=/gi;

let warningsFound = false;

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const matches = content.match(inlineEventRegex);
      if (matches) {
        console.warn(`Warning: Found inline event handlers in ${file}:`);
        matches.forEach(match => console.warn(`  - ${match}`));
        warningsFound = true;
      }
    } else {
      console.warn(`Warning: File not found: ${file}`);
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
  }
});

if (!warningsFound) {
  console.log('No inline event handlers found.');
}

// Ensure the script does not fail (always exit 0)
process.exit(0);
