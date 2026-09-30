const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');

try {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');

  // Look for a meta tag that has both name="twitter:description" and a non-empty content attribute.
  // This regex uses lookaheads to be order-independent.
  const regex = /<meta\s+(?=[^>]*name=(["'])twitter:description\1)(?=[^>]*content=(["'])(?!\2)[^\2]+?\2)[^>]*>/i;

  if (regex.test(html)) {
    console.log('✅ check-twitter-description: Passed');
    process.exit(0);
  } else {
    console.error('❌ check-twitter-description: Failed. Could not find <meta name="twitter:description"> with a non-empty content attribute in index.html.');
    process.exit(1);
  }
} catch (err) {
  console.error(`❌ check-twitter-description: Error reading index.html: ${err.message}`);
  process.exit(1);
}
