const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');

try {
  const content = fs.readFileSync(indexPath, 'utf8');
  if (!content.includes('mailto:')) {
    console.error('Error: index.html does not contain a mailto: link');
    process.exit(1);
  }
  console.log('check-mailto-present: pass');
} catch (error) {
  console.error(`Error reading index.html: ${error.message}`);
  process.exit(1);
}
