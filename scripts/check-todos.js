const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'index.html',
  'privacy.html',
  'css/main.css',
  'js/main.js'
];

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (line.includes('TODO') || line.includes('FIXME')) {
        console.warn(`Warning: TODO or FIXME found in ${file}:${index + 1}`);
      }
    });
  }
});

process.exit(0);
