const fs = require('fs');
const path = require('path');

const ROBOTS_TXT_PATH = path.join(__dirname, '..', 'robots.txt');

try {
  const robotsTxtContent = fs.readFileSync(ROBOTS_TXT_PATH, 'utf-8');

  const sitemapUrls = [];
  const lines = robotsTxtContent.split('\n');

  for (const line of lines) {
    if (line.trim().toLowerCase().startsWith('sitemap:')) {
      const url = line.substring('sitemap:'.length).trim();
      sitemapUrls.push(url);
    }
  }

  if (sitemapUrls.length === 0) {
    console.warn('No sitemap URLs found in robots.txt');
    process.exit(0);
  }

  let hasError = false;

  for (const sitemapUrl of sitemapUrls) {
    try {
      const urlObj = new URL(sitemapUrl);
      const pathname = urlObj.pathname.replace(/^\/+/, '');
      const sitemapPath = path.join(__dirname, '..', pathname);

      if (!fs.existsSync(sitemapPath)) {
        console.error(`Error: Sitemap file not found: ${sitemapPath} (from URL: ${sitemapUrl})`);
        hasError = true;
      } else {
        console.log(`Success: Sitemap file exists: ${pathname}`);
      }
    } catch (e) {
       console.error(`Invalid URL in robots.txt: ${sitemapUrl}`);
       hasError = true;
    }
  }

  if (hasError) {
    process.exit(1);
  } else {
    console.log('All sitemaps exist.');
    process.exit(0);
  }
} catch (error) {
  console.error('Error reading robots.txt:', error);
  process.exit(1);
}
