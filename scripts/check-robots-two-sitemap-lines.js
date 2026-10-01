const fs = require('fs');
const path = require('path');

const robotsPath = path.join(__dirname, '..', 'robots.txt');

try {
  const content = fs.readFileSync(robotsPath, 'utf8');

  const hasSitemap1 = content.includes('Sitemap: https://sounny.github.io/sitemap.xml');
  const hasSitemap2 = content.includes('Sitemap: https://sounny.github.io/sounny_sitemap.xml');

  if (!hasSitemap1 || !hasSitemap2) {
    console.error('robots.txt must contain at least two Sitemap: lines pointing at https://sounny.github.io/sitemap.xml and https://sounny.github.io/sounny_sitemap.xml');
    process.exit(1);
  }

  console.log('check-robots-two-sitemap-lines.js passed');
} catch (error) {
  console.error('Error reading robots.txt:', error.message);
  process.exit(1);
}
