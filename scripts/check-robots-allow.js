const fs = require('fs');
const path = require('path');

const robotsPath = path.join(__dirname, '..', 'robots.txt');

try {
  const content = fs.readFileSync(robotsPath, 'utf8');

  // Check for User-agent line (whitespace-tolerant)
  const userAgentRegex = /User-agent:\s*.+/i;
  if (!userAgentRegex.test(content)) {
    console.error('Error: robots.txt does not contain a User-agent directive.');
    process.exit(1);
  }

  // Check for Allow: / directive (whitespace-tolerant)
  const allowRegex = /Allow:\s*\/\s*(?:\r|\n|$)/i;
  if (!allowRegex.test(content)) {
    console.error('Error: robots.txt does not contain an "Allow: /" directive.');
    process.exit(1);
  }

  console.log('Success: robots.txt contains User-agent and Allow: / directives.');
  process.exit(0);
} catch (err) {
  console.error(`Error reading robots.txt: ${err.message}`);
  process.exit(1);
}
