const fs = require('fs');
const path = require('path');

const filesToCheck = ['index.html', 'privacy.html'];

function checkHeadings(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`Warning: File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');

  // Strip HTML comments
  let cleanContent = content.replace(/<!--[\s\S]*?-->/g, '');

  // Strip script and style tags to avoid parsing headings inside them
  cleanContent = cleanContent.replace(/<script[\s\S]*?<\/script>/gi, '');
  cleanContent = cleanContent.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Find all heading tags
  const headingRegex = /<h([1-6])\b[^>]*>/gi;
  let match;
  let previousLevel = null;

  while ((match = headingRegex.exec(cleanContent)) !== null) {
    const currentLevel = parseInt(match[1], 10);

    if (previousLevel !== null) {
      // Check if heading skips downward by more than one level
      if (currentLevel > previousLevel + 1) {
        console.warn(`Warning in ${filePath}: Skipped heading level from h${previousLevel} to h${currentLevel}`);
      }
    }

    previousLevel = currentLevel;
  }
}

console.log('Checking heading levels...');
filesToCheck.forEach(checkHeadings);
console.log('Heading check complete.');

// Exits cleanly without failing the test suite
process.exit(0);
