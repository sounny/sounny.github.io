const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const files = fs.readdirSync(rootDir);

let hasError = false;

for (const file of files) {
  if (file.endsWith('.html')) {
    const filePath = path.join(rootDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    const iframeRegex = /<iframe\b[^>]*>/gi;
    let match;

    while ((match = iframeRegex.exec(content)) !== null) {
      const iframeTag = match[0];

      const titleMatch = iframeTag.match(/title\s*=\s*(["'])(.*?)\1/i);

      if (!titleMatch || !titleMatch[2] || titleMatch[2].trim() === '') {
        console.error(`Error: iframe missing or empty title attribute in ${file}`);
        console.error(`Tag: ${iframeTag}`);
        hasError = true;
      }
    }
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('All iframes have a non-empty title attribute.');
}
