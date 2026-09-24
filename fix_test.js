const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

if (html.includes('<h4>')) {
    console.log('Error: <h4> found in index.html, expected heading hierarchy to not skip levels');
    process.exit(1);
}

console.log('Accessibility verification passed');
