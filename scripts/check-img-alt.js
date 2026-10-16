const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const files = fs.readdirSync(rootDir);
const htmlFiles = files.filter(f => f.endsWith('.html'));

let hasError = false;

for (const file of htmlFiles) {
  const filePath = path.join(rootDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Use regex to find all img tags
  // This is a simple regex that matches <img ...>
  // It checks if 'alt=' is present inside the tag
  const imgRegex = /<img\s+[^>]*>/gi;
  const altRegex = /alt\s*=\s*(["']).*?\1/i;

  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    const imgTag = match[0];
    if (!altRegex.test(imgTag)) {
      console.error(`Error: <img> tag missing 'alt' attribute in ${file}:\n  ${imgTag}`);
      hasError = true;
    }
  }
}

if (hasError) {
  console.error('One or more <img> tags are missing the alt attribute.');
  process.exit(1);
} else {
  console.log('All <img> tags have an alt attribute.');
}
