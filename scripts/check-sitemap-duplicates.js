const fs = require('fs');

function checkSitemap(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`${filePath} not found, skipping.`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const locRegex = /<loc>(.*?)<\/loc>/g;
  let match;
  const locs = new Set();

  while ((match = locRegex.exec(content)) !== null) {
    const loc = match[1];
    if (locs.has(loc)) {
      console.error(`Duplicate loc found in ${filePath}: ${loc}`);
      process.exit(1);
    }
    locs.add(loc);
  }
  console.log(`No duplicate locs found in ${filePath}`);
}

checkSitemap('sitemap.xml');
checkSitemap('sounny_sitemap.xml');
