const fs = require('fs');
const path = require('path');

const filename = 'google03d463aa06323fde.html';
const filepath = path.join(__dirname, '..', filename);
const expectedContent = 'google-site-verification: google03d463aa06323fde.html';

if (!fs.existsSync(filepath)) {
  console.error(`Error: ${filename} does not exist.`);
  process.exit(1);
}

const content = fs.readFileSync(filepath, 'utf8').trim();

if (!content.includes(expectedContent)) {
  console.error(`Error: ${filename} does not contain the expected google-site-verification text.`);
  process.exit(1);
}

console.log(`${filename} verified successfully.`);
process.exit(0);
