const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const files = ['index.html', 'privacy.html'];
let hasError = false;

for (const file of files) {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: ${file} not found. Skipping.`);
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  const linkRegex = /<link[^>]*href="([^"]+)"[^>]*rel="([^"]*icon[^"]*)"[^>]*>|<link[^>]*rel="([^"]*icon[^"]*)"[^>]*href="([^"]+)"[^>]*>/gi;

  let match;
  let foundIcon = false;
  while ((match = linkRegex.exec(content)) !== null) {
    foundIcon = true;
    const href = match[1] || match[4];

    let url;
    try {
      url = new URL(href, 'https://sounny.github.io');
    } catch (e) {
      console.error(`Invalid URL in ${file}: ${href}`);
      hasError = true;
      continue;
    }

    const pathname = url.pathname;
    const localFile = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    const localFilePath = path.join(rootDir, localFile);

    if (!fs.existsSync(localFilePath)) {
      console.error(`Error: ${file} references icon '${href}', but '${localFile}' does not exist on disk.`);
      hasError = true;
    } else {
      console.log(`Success: ${file} references icon '${href}' which exists at '${localFile}'`);
    }
  }

  if (!foundIcon) {
    console.error(`Error: No icon links found in ${file}`);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log("All favicon references exist on disk.");
}
