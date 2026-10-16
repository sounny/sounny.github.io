const fs = require('fs');
const path = require('path');

const files = ['index.html', 'privacy.html'];
let hasError = false;

for (const file of files) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.error(`File ${file} does not exist`);
    hasError = true;
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Use a more robust regex that ignores spaces/newlines within the tags
  const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  if (!titleMatch || titleMatch[1].trim() === '') {
    console.error(`ERROR: ${file} does not have a non-empty <title> element.`);
    hasError = true;
  } else {
    console.log(`OK: ${file} has a valid title.`);
  }
}

if (hasError) {
  process.exit(1);
}
