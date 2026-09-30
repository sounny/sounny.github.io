const fs = require('fs');
const path = require('path');

const faviconPath = path.join(__dirname, '..', 'favicon.png');

try {
  const stats = fs.statSync(faviconPath);
  if (stats.size > 0) {
    console.log('✅ favicon.png exists and is not empty.');
    process.exit(0);
  } else {
    console.error('❌ favicon.png exists but is empty (size 0).');
    process.exit(1);
  }
} catch (err) {
  if (err.code === 'ENOENT') {
    console.error('❌ favicon.png does not exist.');
  } else {
    console.error('❌ Error checking favicon.png:', err.message);
  }
  process.exit(1);
}
