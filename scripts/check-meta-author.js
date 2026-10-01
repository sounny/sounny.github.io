const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = '';
try {
  html = fs.readFileSync(indexPath, 'utf-8');
} catch (e) {
  console.error(`Error reading index.html: ${e.message}`);
  process.exit(1);
}

// Find all <meta> tags
const tagRegex = /<meta[^>]*>/gi;
let foundValidTag = false;

let tagMatch;
while ((tagMatch = tagRegex.exec(html)) !== null) {
  const tag = tagMatch[0];

  // Check if it has name="author"
  if (/name=["']author["']/i.test(tag)) {
    // Check if it has a content attribute
    const contentMatch = tag.match(/content=["']([^"']*)["']/i);
    if (contentMatch && contentMatch[1].trim() !== '') {
      foundValidTag = true;
      break;
    } else {
        console.error('Error: <meta name="author"> found, but its content attribute is empty.');
        process.exit(1);
    }
  }
}

if (!foundValidTag) {
  console.error('Error: index.html must contain a <meta name="author"> tag with a non-empty content attribute.');
  process.exit(1);
}

console.log('Success: Valid <meta name="author"> tag found in index.html.');
process.exit(0);
