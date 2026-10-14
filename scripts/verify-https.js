const fs = require('fs');
const path = require('path');

const filesToAnalyze = ['index.html', 'privacy.html'];
let hasError = false;

for (const file of filesToAnalyze) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} because it does not exist.`);
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Match <script>, <link>, <img>, <iframe> tags
  const tagRegex = /<(script|link|img|iframe)\s+[^>]*>/gi;
  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    const tag = match[0];
    const tagName = match[1].toLowerCase();

    // Ignore links that are not stylesheets
    if (tagName === 'link') {
      const isStylesheet = tag.toLowerCase().includes('rel="stylesheet"') ||
                           tag.toLowerCase().includes("rel='stylesheet'") ||
                           tag.toLowerCase().includes("rel=stylesheet");
      if (!isStylesheet) {
        continue;
      }
    }

    // Look for src or href attributes with http://
    const srcHrefMatch = tag.match(/(?:src|href)\s*=\s*['"]?(http:\/\/[^'"\s>]+)['"]?/i);
    if (srcHrefMatch) {
      console.warn(`Warning: In ${file}, found insecure resource loaded via http://`);
      console.warn(`  ${tag}`);
      hasError = true;
    }
  }
}

if (hasError) {
  console.error("Test failed: Found resources loaded over plain http://.");
  process.exit(1);
} else {
  console.log('Pass: No insecure http:// resources found in script, stylesheet, image, or iframe tags.');
}
