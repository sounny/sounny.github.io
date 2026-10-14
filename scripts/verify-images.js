const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const cardsDirPath = path.join(__dirname, '..', 'img', 'cards');

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Find all references to img/cards/* in index.html
const regex = /img\/cards\/([^"'\s)>]+)/g;
let match;
const referencedImages = new Set();

while ((match = regex.exec(indexHtml)) !== null) {
  referencedImages.add(match[1]);
}

// Get all actual files in img/cards/
const actualFiles = fs.readdirSync(cardsDirPath);
const actualFilesSet = new Set(actualFiles);

let hasErrors = false;

// Check if all referenced images exist
for (const ref of referencedImages) {
  if (!actualFilesSet.has(ref)) {
    console.error(`Error: Referenced image img/cards/${ref} does not exist.`);
    hasErrors = true;
  }
}

// Check for unreferenced images
for (const file of actualFiles) {
  if (!referencedImages.has(file)) {
    console.warn(`Warning: Image img/cards/${file} is not referenced in index.html.`);
  }
}

if (hasErrors) {
  process.exit(1);
} else {
  console.log('All referenced card images exist.');
}
