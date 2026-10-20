const fs = require('fs');
const path = require('path');

const filesToCheck = ['index.html', 'privacy.html'];

function stripBlock(text, startStr, endStr) {
  let result = '';
  let currentIndex = 0;
  while (true) {
    const startIndex = text.indexOf(startStr, currentIndex);
    if (startIndex === -1) {
      result += text.slice(currentIndex);
      break;
    }
    result += text.slice(currentIndex, startIndex);
    const endIndex = text.indexOf(endStr, startIndex + startStr.length);
    if (endIndex === -1) {
      break;
    }
    currentIndex = endIndex + endStr.length;
  }
  return result;
}

function checkHeadings(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`Warning: File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  let lowerContent = content.toLowerCase();

  // Strip HTML comments, scripts, and styles using string matching to avoid ReDoS
  lowerContent = stripBlock(lowerContent, '<!--', '-->');
  lowerContent = stripBlock(lowerContent, '<script', '</script>');
  lowerContent = stripBlock(lowerContent, '<style', '</style>');

  // Find all heading tags
  const headingRegex = /<h([1-6])\b[^>]*>/g;
  let match;
  let previousLevel = null;

  while ((match = headingRegex.exec(lowerContent)) !== null) {
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
