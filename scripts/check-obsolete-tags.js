const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..');
const files = fs.readdirSync(dir).filter(f => !fs.statSync(path.join(dir, f)).isDirectory() && f.endsWith('.html'));
const pattern = /<\/?(center|font|marquee|blink)\b/i;
let failed = false;

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  if (pattern.test(content)) {
    console.error(`Error: File ${file} contains obsolete HTML tags.`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log('Check passed: No obsolete HTML tags found.');
}
