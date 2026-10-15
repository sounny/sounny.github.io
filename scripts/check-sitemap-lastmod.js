const fs = require('fs');
const path = require('path');

const filesToCheck = ['sitemap.xml', 'sounny_sitemap.xml'];
const iso8601Regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

let hasErrors = false;

for (const fileName of filesToCheck) {
  const filePath = path.join(__dirname, '..', fileName);
  if (!fs.existsSync(filePath)) {
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lastmodRegex = /<lastmod>(.*?)<\/lastmod>/g;
  let match;

  while ((match = lastmodRegex.exec(content)) !== null) {
    const lastmodValue = match[1].trim();
    if (!iso8601Regex.test(lastmodValue)) {
      console.error(`Invalid <lastmod> value "${lastmodValue}" in ${fileName}. Must be ISO-8601 (YYYY-MM-DD or full datetime).`);
      hasErrors = true;
    }
  }
}

if (hasErrors) {
  process.exit(1);
} else {
  console.log('All <lastmod> values are valid ISO-8601 dates.');
}
