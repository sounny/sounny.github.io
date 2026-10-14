const fs = require('fs');
const path = require('path');

const filesToCheck = ['index.html', 'privacy.html'];
let hasDuplicates = false;

const idRegex = /id\s*=\s*["']([^"']+)["']/g;

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${file}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const seenIds = new Set();

  let match;
  while ((match = idRegex.exec(content)) !== null) {
    const id = match[1];
    if (seenIds.has(id)) {
      console.warn(`Warning: Duplicate ID found in ${file}: "${id}"`);
      hasDuplicates = true;
    } else {
      seenIds.add(id);
    }
  }
});

if (hasDuplicates) {
  process.exit(1);
}
