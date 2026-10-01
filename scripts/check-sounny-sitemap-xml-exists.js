const fs = require('fs');
const path = require('path');

const sitemapPath = path.join(__dirname, '..', 'sounny_sitemap.xml');

try {
  const stats = fs.statSync(sitemapPath);
  if (stats.size > 0) {
    console.log('✅ sounny_sitemap.xml exists and size > 0');
    process.exit(0);
  } else {
    console.error('❌ sounny_sitemap.xml exists but size is 0');
    process.exit(1);
  }
} catch (err) {
  console.error(`❌ sounny_sitemap.xml does not exist or cannot be read: ${err.message}`);
  process.exit(1);
}
