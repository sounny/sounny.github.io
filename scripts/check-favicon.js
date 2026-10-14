const fs = require('fs');
const path = require('path');

const faviconPath = path.join(__dirname, '..', 'favicon.png');

try {
  const stats = fs.statSync(faviconPath);
  if (stats.size === 0) {
    console.error('Error: favicon.png is empty.');
    process.exit(1);
  }
} catch (err) {
  if (err.code === 'ENOENT') {
    console.error('Error: favicon.png is missing.');
    process.exit(1);
  } else {
    console.error(`Error checking favicon.png: ${err.message}`);
    process.exit(1);
  }
}

console.log('favicon.png check passed.');
