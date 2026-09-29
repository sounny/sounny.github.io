const fs = require('fs');
const path = require('path');

const readmePath = path.join(__dirname, '..', 'README.md');

try {
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const firstLine = readmeContent.split('\n')[0].trim();

  if (!firstLine.startsWith('# ')) {
    console.error('Error: README.md must begin with a level 1 heading (# ).');
    console.error(`Found: "${firstLine}"`);
    process.exit(1);
  }

  if (!firstLine.includes('Sounny')) {
    console.error('Error: The first heading in README.md must include "Sounny".');
    console.error(`Found: "${firstLine}"`);
    process.exit(1);
  }

  console.log('Success: README.md starts with a valid # heading including "Sounny".');
  process.exit(0);
} catch (error) {
  console.error('Error reading README.md:', error.message);
  process.exit(1);
}
