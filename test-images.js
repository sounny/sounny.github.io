const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const imgRegex = /<img\s+[^>]*>/g;
let match;
let failed = false;
while ((match = imgRegex.exec(html)) !== null) {
  if (!match[0].includes('alt="')) {
    console.error(`Error: Image missing alt attribute: ${match[0]}`);
    failed = true;
  }
}
if (failed) {
  process.exit(1);
} else {
  console.log('All images have alt attributes.');
}
