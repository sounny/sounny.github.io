const fs = require('fs');

try {
  const html = fs.readFileSync('index.html', 'utf8');

  // Match <meta ...> with name="twitter:image" (or 'twitter:image') and content="https://..." (or 'https://...')
  // Using lookaheads for attribute order independence
  const regex = /<meta\s+(?=[^>]*\bname=(['"])twitter:image\1)(?=[^>]*\bcontent=(['"])https:\/\/(?:(?!\2).)+\2)[^>]*>/i;

  if (!regex.test(html)) {
    console.error('Error: index.html must contain <meta name="twitter:image" content="https://..."> with a non-empty https URL.');
    process.exit(1);
  }

  console.log('check-twitter-image-https.js passed: <meta name="twitter:image"> contains a valid https URL.');
  process.exit(0);
} catch (error) {
  console.error(`Error reading index.html: ${error.message}`);
  process.exit(1);
}
