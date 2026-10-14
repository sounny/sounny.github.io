const fs = require('fs');
const path = require('path');

const filesToCheck = ['index.html', 'privacy.html'];
const inlineEventRegex = /\bon[a-z]+\s*=/gi;
let hasErrors = false;

for (const file of filesToCheck) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: File ${file} not found.`);
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const matches = line.match(inlineEventRegex);
    if (matches) {
      console.error(`Error: Found inline event handler in ${file} on line ${index + 1}:`);
      console.error(`  ${line.trim()}`);
      hasErrors = true;
    }
  });
}

if (hasErrors) {
  console.error('Failed: Inline event handlers are not allowed.');
  process.exit(1);
} else {
  console.log('Success: No inline event handlers found in HTML files.');
  process.exit(0);
}
