const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');

try {
  const content = fs.readFileSync(filePath, 'utf8');

  // Find all script tags with application/ld+json
  const scriptRegex = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let hasType = false;
  let hasLdJson = false;

  while ((match = scriptRegex.exec(content)) !== null) {
    hasLdJson = true;
    const jsonStr = match[1];

    try {
      const parsed = JSON.parse(jsonStr);

      // Check if it's an object with @type or an array containing an object with @type
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === 'object' && item['@type']) {
            hasType = true;
            break;
          }
        }
      } else if (parsed && typeof parsed === 'object') {
        if (parsed['@type']) {
          hasType = true;
        }
      }

      if (hasType) break;
    } catch (e) {
      // If JSON parsing fails, fall back to simple string matching
      if (jsonStr.includes('"@type"')) {
        hasType = true;
        break;
      }
    }
  }

  if (!hasLdJson) {
    console.error('Error: index.html does not contain a <script type="application/ld+json"> tag.');
    process.exit(1);
  }

  if (!hasType) {
    console.error('Error: The application/ld+json script tag in index.html does not contain an "@type" property.');
    process.exit(1);
  }

  console.log('Success: index.html contains a valid application/ld+json script block with an "@type" property.');
} catch (err) {
  console.error('Failed to check json-ld type:', err.message);
  process.exit(1);
}
