const fs = require('fs');
const path = require('path');

const robotsPath = path.join(__dirname, '..', 'robots.txt');

try {
  if (!fs.existsSync(robotsPath)) {
    console.error('Error: robots.txt is missing.');
    process.exit(1);
  }

  const content = fs.readFileSync(robotsPath, 'utf8');
  if (!content || content.trim() === '') {
    console.error('Error: robots.txt is empty.');
    process.exit(1);
  }

  console.log('robots.txt check passed.');
} catch (err) {
  console.error(`Error reading robots.txt: ${err.message}`);
  process.exit(1);
}
