const fs = require('fs');
const path = require('path');

const licensePath = path.join(__dirname, '..', 'LICENSE');

if (!fs.existsSync(licensePath)) {
  console.error('Error: LICENSE file does not exist at the repository root.');
  process.exit(1);
}

const stats = fs.statSync(licensePath);
if (stats.size === 0) {
  console.error('Error: LICENSE file exists but is empty.');
  process.exit(1);
}

console.log('Success: LICENSE file exists and is not empty.');
