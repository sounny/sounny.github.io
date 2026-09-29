const fs = require('fs');
const path = require('path');

const sitemaps = ['sitemap.xml', 'sounny_sitemap.xml'];
let hasError = false;

sitemaps.forEach(file => {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  const locRegex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(content)) !== null) {
    const urlStr = match[1].trim();
    try {
      const parsedUrl = new URL(urlStr);
      let localPath = parsedUrl.pathname;
      if (localPath.startsWith('/')) {
        localPath = localPath.substring(1);
      }
      if (localPath === '' || localPath.endsWith('/')) {
        localPath += 'index.html';
      } else if (!path.extname(localPath)) {
        // If there's no extension, it could be a directory with index.html or a .html file
        if (fs.existsSync(path.join(__dirname, localPath + '.html'))) {
          localPath += '.html';
        } else {
          localPath += '/index.html';
        }
      }

      const fullPath = path.join(__dirname, localPath);
      if (!fs.existsSync(fullPath)) {
        console.error(`Error: Missing file for URL ${urlStr} (expected ${localPath}) in ${file}`);
        hasError = true;
      }
    } catch (e) {
      console.error(`Invalid URL: ${urlStr}`);
      hasError = true;
    }
  }
});

if (hasError) {
  process.exit(1);
}
console.log('Sitemap validation passed.');
