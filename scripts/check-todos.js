const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const content = fs.readFileSync(indexPath, 'utf-8');

const commentRegex = /<!--([\s\S]*?)-->/g;
let match;
let hasError = false;

while ((match = commentRegex.exec(content)) !== null) {
  const commentText = match[1];
  if (commentText.includes('TODO') || commentText.includes('FIXME')) {
    console.error(`Error: Found TODO or FIXME in HTML comment: <!--${commentText}-->`);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('check-todos.js: No TODO or FIXME comments found in index.html.');
}
