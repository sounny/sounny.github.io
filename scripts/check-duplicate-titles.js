const fs = require('fs');
const path = require('path');

const dir = process.cwd();
const files = fs.readdirSync(dir).filter(file => file.endsWith('.html'));

const titleMap = new Map();
let hasError = false;

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf-8');
  const titleMatch = content.match(/<title>(.*?)<\/title>/is);

  if (titleMatch) {
    const title = titleMatch[1].trim();
    if (titleMap.has(title)) {
      console.error(`Error: Duplicate title found in ${file} and ${titleMap.get(title)}. Title: "${title}"`);
      hasError = true;
    } else {
      titleMap.set(title, file);
    }
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('✅ No duplicate titles found in top-level HTML files.');
}
