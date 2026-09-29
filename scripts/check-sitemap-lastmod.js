const fs = require('fs');
const path = require('path');

const filesToCheck = ['sitemap.xml', 'sounny_sitemap.xml'];
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

let hasErrors = false;

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lastmodRegex = /<lastmod>([^<]+)<\/lastmod>/g;
  let match;

  while ((match = lastmodRegex.exec(content)) !== null) {
    const dateValue = match[1].trim();
    if (!dateRegex.test(dateValue)) {
      console.error(`Invalid lastmod date in ${file}: '${dateValue}'. Expected format: YYYY-MM-DD`);
      hasErrors = true;
    }
  }
});

if (hasErrors) {
  process.exit(1);
} else {
  console.log('All lastmod dates are valid in sitemaps.');
}
