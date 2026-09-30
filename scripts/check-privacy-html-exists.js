const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'privacy.html');

if (!fs.existsSync(filePath)) {
  console.error('Error: privacy.html does not exist at repo root.');
  process.exit(1);
}

const stats = fs.statSync(filePath);
if (stats.size === 0) {
  console.error('Error: privacy.html exists but is empty (size 0).');
  process.exit(1);
}

console.log('Success: privacy.html exists and is not empty.');
process.exit(0);
