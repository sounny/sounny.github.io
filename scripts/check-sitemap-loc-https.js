const fs = require('fs');
const path = require('path');

const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
  console.error('sitemap.xml not found. Skipping check.');
  process.exit(0);
}

const sitemap = fs.readFileSync(sitemapPath, 'utf8');
const locRegex = /<loc>([^<]+)<\/loc>/g;

let match;
let hasErrors = false;

while ((match = locRegex.exec(sitemap)) !== null) {
  const locText = match[1].trim();
  if (!locText.startsWith('https://')) {
    console.error(`Error: Invalid <loc> value in sitemap.xml: "${locText}". Must start with "https://".`);
    hasErrors = true;
  }
}

if (hasErrors) {
  process.exit(1);
}

console.log('check-sitemap-loc-https: All <loc> tags use https://');
