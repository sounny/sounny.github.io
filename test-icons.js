const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const iconRegex = /<i\s+[^>]*class="[^"]*(?:fas|fab)[^"]*"[^>]*>/g;
let match;
let failed = false;
while ((match = iconRegex.exec(html)) !== null) {
  if (!match[0].includes('aria-hidden="true"')) {
    console.error(`Error: Icon missing aria-hidden="true": ${match[0]}`);
    failed = true;
  }
}
if (failed) {
  process.exit(1);
} else {
  console.log('All icons have aria-hidden="true".');
}
