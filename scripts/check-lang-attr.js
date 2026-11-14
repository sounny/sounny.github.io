const fs = require('fs');

const files = ['index.html', 'privacy.html'];
let hasError = false;

for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    // Check if <html ... lang="..."> is present. We can use a regex.
    // The requirement says "fails if index.html or privacy.html lacks a lang attribute on the html element"
    const htmlTagMatch = content.match(/<html[^>]*>/i);
    if (!htmlTagMatch) {
      process.stderr.write(`Error: Could not find <html> tag in ${file}\n`);
      hasError = true;
      continue;
    }

    const htmlTag = htmlTagMatch[0];
    if (!/lang\s*=\s*["'][^"']+["']/i.test(htmlTag)) {
      process.stderr.write(`Error: <html> tag in ${file} lacks a lang attribute.\n`);
      hasError = true;
    }
  } catch (err) {
    process.stderr.write(`Error reading ${file}: ${err.message}\n`);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
}
