const fs = require('fs');
const path = require('path');

const licensePath = path.join(__dirname, '..', 'LICENSE');

try {
  const stats = fs.statSync(licensePath);
  if (!stats.isFile()) {
    console.error('LICENSE exists but is not a file.');
    process.exit(1);
  }

  if (stats.size === 0) {
    console.error('LICENSE exists but is empty.');
    process.exit(1);
  }

  console.log('LICENSE check passed.');
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('LICENSE file not found in the repository root.');
  } else {
    console.error('An error occurred while checking the LICENSE file:', error.message);
  }
  process.exit(1);
}
