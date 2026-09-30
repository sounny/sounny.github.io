const fs = require('fs');
const path = require('path');

const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');

try {
  const content = fs.readFileSync(sitemapPath, 'utf8');

  // Find all <url>...</url> blocks
  const urlRegex = /<url>([\s\S]*?)<\/url>/g;
  let match;
  let missing = false;

  while ((match = urlRegex.exec(content)) !== null) {
    const urlContent = match[1];

    // Check for <lastmod> tag with non-empty content
    const lastmodRegex = /<lastmod>\s*([^<\s][^<]*?)\s*<\/lastmod>/;
    const lastmodMatch = urlContent.match(lastmodRegex);

    if (!lastmodMatch || lastmodMatch[1].trim() === '') {
      console.error('Error: sitemap.xml contains a <url> block missing a non-empty <lastmod> child.');
      missing = true;
    }
  }

  if (missing) {
    process.exit(1);
  }

  console.log('Success: All <url> blocks in sitemap.xml contain a non-empty <lastmod> child.');
} catch (error) {
  console.error(`Error reading sitemap.xml: ${error.message}`);
  process.exit(1);
}
