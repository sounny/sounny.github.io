const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

let failed = false;

// Check icons
const iconRegex = /<i\s+[^>]*class="[^"]*(?:fas|fab)[^"]*"[^>]*>/g;
let match;
while ((match = iconRegex.exec(html)) !== null) {
  if (!match[0].includes('aria-hidden="true"')) {
    console.error(`Error: Icon missing aria-hidden="true": ${match[0]}`);
    failed = true;
  }
}

// Check images
const imgRegex = /<img\s+[^>]*>/g;
while ((match = imgRegex.exec(html)) !== null) {
  if (!match[0].includes('alt="')) {
    console.error(`Error: Image missing alt attribute: ${match[0]}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log('All accessibility checks passed for icons and images.');
}
