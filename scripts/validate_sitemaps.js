const fs = require('fs');

const parseLocs = (content) => {
  const matches = [...content.matchAll(/<loc>(.*?)<\/loc>/g)];
  return matches.map(m => m[1]).sort();
};

const sitemap1 = fs.readFileSync('sitemap.xml', 'utf-8');
const sitemap2 = fs.readFileSync('sounny_sitemap.xml', 'utf-8');

const locs1 = parseLocs(sitemap1);
const locs2 = parseLocs(sitemap2);

if (locs1.length !== locs2.length || !locs1.every((val, index) => val === locs2[index])) {
  console.error('Sitemaps have inconsistent URLs!');
  console.error('sitemap.xml:', locs1);
  console.error('sounny_sitemap.xml:', locs2);
  process.exit(1);
}

const robots = fs.readFileSync('robots.txt', 'utf-8');
if (!robots.includes('Sitemap: https://sounny.github.io/sitemap.xml')) {
  console.error('robots.txt missing sitemap.xml');
  process.exit(1);
}
if (!robots.includes('Sitemap: https://sounny.github.io/sounny_sitemap.xml')) {
  console.error('robots.txt missing sounny_sitemap.xml');
  process.exit(1);
}

console.log('Sitemaps are consistent and properly referenced in robots.txt.');
