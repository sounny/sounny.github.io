const fs = require('fs');
const path = require('path');

const filesToCheck = ['index.html', 'privacy.html'];
let hasError = false;

const regex = /<meta\s+charset=["']?utf-8["']?\s*\/?>/i;

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!regex.test(content)) {
      console.error(`Error: ${file} lacks <meta charset="utf-8">`);
      hasError = true;
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
    hasError = true;
  }
});

if (hasError) {
  process.exit(1);
} else {
  console.log('Charset UTF-8 check passed.');
}
