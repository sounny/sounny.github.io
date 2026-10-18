const fs = require('fs');
const path = require('path');

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const htmlFiles = findHtmlFiles('.');
const allowlist = [];
const regex = /<a\s+[^>]*href=(["'])\1[^>]*>/gi;
let failed = false;

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = [...content.matchAll(regex)];
  const unexpectedMatches = matches.filter(match => {
    return !allowlist.some(allowed => match[0].includes(allowed));
  });

  if (unexpectedMatches.length > 0) {
    console.error(`Error: Found empty href in ${file}: ${unexpectedMatches.map(m => m[0]).join(', ')}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
