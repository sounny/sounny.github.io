const fs = require('fs');
const path = require('path');

const robotsPath = path.join(__dirname, '..', 'robots.txt');

try {
  if (!fs.existsSync(robotsPath)) {
    console.error('check-robots-user-agent-star.js: robots.txt does not exist.');
    process.exit(1);
  }

  const content = fs.readFileSync(robotsPath, 'utf8');

  const regex = /User-agent:\s*\*/i;

  if (!regex.test(content)) {
    console.error('check-robots-user-agent-star.js: robots.txt does not contain "User-agent: *" directive.');
    process.exit(1);
  }

  console.log('check-robots-user-agent-star.js: robots.txt contains "User-agent: *" directive.');
} catch (error) {
  console.error(`check-robots-user-agent-star.js: Error reading robots.txt: ${error.message}`);
  process.exit(1);
}
