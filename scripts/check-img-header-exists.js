const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'img', 'header.jpg');

if (!fs.existsSync(targetPath)) {
  console.error('Error: img/header.jpg does not exist.');
  process.exit(1);
}

const stats = fs.statSync(targetPath);
if (stats.size === 0) {
  console.error('Error: img/header.jpg exists but is empty.');
  process.exit(1);
}

console.log('Success: img/header.jpg exists and is not empty.');
process.exit(0);
