const fs = require('fs');
const path = require('path');

const filesToCheck = ['index.html', 'privacy.html'];

let hasError = false;

for (const file of filesToCheck) {
  if (!fs.existsSync(file)) {
    continue;
  }

  const html = fs.readFileSync(file, 'utf8');
  // Match <script ... src="something" ... >
  const scriptRegex = /<script\s+[^>]*src=["'](.*?)["'][^>]*>/gi;

  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const src = match[1];

    // Ignore absolute URLs (http://, https://, //)
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
      continue;
    }

    // Check if the local file exists
    const scriptPath = path.resolve(__dirname, '..', src);
    if (!fs.existsSync(scriptPath)) {
      console.error(`Error in ${file}: Local script source not found: ${src}`);
      hasError = true;
    }
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('All local script sources resolved successfully.');
}
