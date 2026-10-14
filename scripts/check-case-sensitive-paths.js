const fs = require('fs');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const name = file.name;
    if (name === '.git' || name === 'node_modules') continue;

    const filePath = dir === '.' ? name : dir + '/' + name;

    if (file.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function checkPaths() {
  const htmlFiles = ['index.html', 'privacy.html'];
  const allFiles = getAllFiles('.');

  const exactFiles = new Set(allFiles);
  const lowerCaseFiles = new Set(allFiles.map(f => f.toLowerCase()));

  let hasError = false;

  for (const file of htmlFiles) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');

    const regex = /(?:src|href)=["']([^"']+)["']/ig;
    let match;
    while ((match = regex.exec(content)) !== null) {
      let url = match[1];
      if (url.startsWith('http://') ||
          url.startsWith('https://') ||
          url.startsWith('//') ||
          url.startsWith('mailto:') ||
          url.startsWith('tel:') ||
          url.startsWith('data:') ||
          url.startsWith('#')) {
        continue;
      }

      url = url.split('?')[0].split('#')[0];

      if (!url || url === '') continue;

      if (url.startsWith('/')) {
        url = url.substring(1);
      } else if (url.startsWith('./')) {
        url = url.substring(2);
      }

      if (!url) continue;

      const lowerUrl = url.toLowerCase();
      if (lowerCaseFiles.has(lowerUrl) && !exactFiles.has(url)) {
        console.error(`Error: Case-insensitive match found in ${file}: '${url}' matches a file but case is incorrect.`);
        hasError = true;
      }
    }
  }

  if (hasError) {
    process.exit(1);
  } else {
    console.log('All relative paths in HTML files are case-correct.');
  }
}

checkPaths();
