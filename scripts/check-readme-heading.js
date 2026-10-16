const fs = require('fs');

const readmeContent = fs.readFileSync('README.md', 'utf8');

if (!readmeContent.startsWith('# ')) {
  console.error('README.md must start with a level-1 heading ("# ").');
  process.exit(1);
}

console.log('README.md heading check passed.');
