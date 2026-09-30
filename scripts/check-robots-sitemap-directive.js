const fs = require('fs');
const path = require('path');

const robotsPath = path.join(__dirname, '..', 'robots.txt');

if (!fs.existsSync(robotsPath)) {
  console.error('robots.txt not found');
  process.exit(1);
}

const content = fs.readFileSync(robotsPath, 'utf8');

const sitemapRegex = /^Sitemap:\s*https:\/\/sounny\.github\.io\/sitemap\.xml\s*$/im;

if (!sitemapRegex.test(content)) {
  console.error('robots.txt must contain a Sitemap: line pointing at https://sounny.github.io/sitemap.xml');
  process.exit(1);
}

console.log('robots.txt contains the correct Sitemap directive.');
process.exit(0);
