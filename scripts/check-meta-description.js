const fs = require('fs');
const path = require('path');

try {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  const metaTags = html.match(/<meta[^>]+>/ig) || [];
  let found = false;
  let hasContent = false;

  for (const tag of metaTags) {
    if (/name=["']description["']/i.test(tag) || /name=description[\s>]/i.test(tag)) {
      found = true;
      const contentMatch = tag.match(/content=["']([^"']*)["']/i);
      if (contentMatch && contentMatch[1].trim().length > 0) {
        hasContent = true;
      }
      break; // Found the description tag
    }
  }

  if (!found) {
    console.error("Error: index.html lacks a <meta name=\"description\"> tag.");
    process.exit(1);
  }

  if (!hasContent) {
    console.error("Error: index.html <meta name=\"description\"> tag lacks a non-empty content attribute.");
    process.exit(1);
  }

  console.log("Success: index.html contains a non-empty <meta name=\"description\">.");
  process.exit(0);

} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
