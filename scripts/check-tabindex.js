const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const files = fs.readdirSync(rootDir);
const htmlFiles = files.filter(f => f.endsWith('.html'));

let hasError = false;

// Matches tabindex="X" or tabindex='X' or tabindex=X where X > 0
// We'll capture the value to check if it's > 0
const tabindexRegex = /tabindex\s*=\s*(["']?)(\d+)\1/gi;

for (const file of htmlFiles) {
  const filePath = path.join(rootDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  let match;
  while ((match = tabindexRegex.exec(content)) !== null) {
    const valueStr = match[2];
    const value = parseInt(valueStr, 10);

    if (value > 0) {
      console.error(`Error: File ${file} has a tabindex greater than 0: tabindex="${value}"`);
      hasError = true;
    }
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('check-tabindex: All html files have valid tabindex values.');
}
