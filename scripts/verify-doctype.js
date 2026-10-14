const fs = require('fs');
const path = require('path');

const filesToVerify = ['index.html', 'privacy.html'];
const doctypeRegex = /^\s*<!doctype\s+html>/i;

let allPassed = true;

for (const filename of filesToVerify) {
  const filepath = path.join(__dirname, '..', filename);
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    if (!doctypeRegex.test(content)) {
      console.error(`Error: ${filename} does not start with <!DOCTYPE html>`);
      allPassed = false;
    } else {
      console.log(`Success: ${filename} starts with <!DOCTYPE html>`);
    }
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
    allPassed = false;
  }
}

if (!allPassed) {
  process.exit(1);
}
