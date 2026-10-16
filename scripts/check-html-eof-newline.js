const fs = require('fs');
const path = require('path');

const allowlist = [
  'google03d463aa06323fde.html',
  'index.html',
  'privacy.html'
];

const dir = process.cwd();
const files = fs.readdirSync(dir);

let hasError = false;

for (const file of files) {
  if (file.endsWith('.html')) {
    if (allowlist.includes(file)) {
      continue;
    }

    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    if (!content.endsWith('\n')) {
      console.error(`Error: File ${file} does not end with a newline.`);
      hasError = true;
    }
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('All non-allowlisted top-level .html files end with a newline.');
}
