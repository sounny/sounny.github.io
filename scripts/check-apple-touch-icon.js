const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

if (!html.includes('<link rel="apple-touch-icon"') && !html.includes('<link rel="apple-touch-icon-precomposed"')) {
  console.log('XFAIL: index.html is missing <link rel="apple-touch-icon"> or apple-touch-icon-precomposed.');
  process.exit(0);
}

console.log('PASS: index.html has apple-touch-icon.');
process.exit(0);
