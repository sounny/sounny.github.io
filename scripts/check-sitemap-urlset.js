const fs = require('fs');
const path = require('path');

function checkSitemap(filename) {
  const filepath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(filepath)) {
    if (filename === 'sounny_sitemap.xml') {
      return; // Optional
    }
    console.error(`Error: ${filename} does not exist.`);
    process.exit(1);
  }

  const content = fs.readFileSync(filepath, 'utf8');

  // Assert it contains <urlset> and at least one <url><loc>
  // A simple regex approach will work given the typical structure
  const urlsetMatch = /<urlset[\s\>]/i.test(content);
  if (!urlsetMatch) {
    console.error(`Error: ${filename} is missing <urlset> tag.`);
    process.exit(1);
  }

  const urlLocMatch = /<url>\s*<loc>.*<\/loc>/i.test(content);
  if (!urlLocMatch) {
    console.error(`Error: ${filename} does not contain at least one <url><loc> block.`);
    process.exit(1);
  }

  console.log(`Success: ${filename} looks valid.`);
}

checkSitemap('sitemap.xml');
checkSitemap('sounny_sitemap.xml');
