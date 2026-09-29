const fs = require('fs');
const path = require('path');

const licensePath = path.join(__dirname, '..', 'LICENSE');

if (!fs.existsSync(licensePath)) {
  console.error('LICENSE file does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(licensePath, 'utf8');

if (!content.includes('MIT')) {
  console.error('LICENSE file does not contain "MIT".');
  process.exit(1);
}

console.log('LICENSE file exists and contains "MIT".');
process.exit(0);
