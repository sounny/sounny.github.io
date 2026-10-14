const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'css', 'main.css');
const css = fs.readFileSync(cssPath, 'utf8');

let insideString = false;
let stringChar = null;
let insideComment = false;
let braceDepth = 0;

for (let i = 0; i < css.length; i++) {
  const char = css[i];
  const nextChar = css[i + 1] || '';

  if (insideComment) {
    if (char === '*' && nextChar === '/') {
      insideComment = false;
      i++;
    }
    continue;
  }

  if (insideString) {
    if (char === '\\') {
      i++;
      continue;
    }
    if (char === stringChar) {
      insideString = false;
      stringChar = null;
    }
    continue;
  }

  if (char === '/' && nextChar === '*') {
    insideComment = true;
    i++;
    continue;
  }

  if (char === "'" || char === '"') {
    insideString = true;
    stringChar = char;
    continue;
  }

  if (char === '{') {
    braceDepth++;
  } else if (char === '}') {
    braceDepth--;
    if (braceDepth < 0) {
      console.error('Error: Unbalanced braces (too many closing braces)');
      process.exit(1);
    }
  }
}

if (insideComment) {
  console.error('Error: Unterminated comment');
  process.exit(1);
}

if (braceDepth > 0) {
  console.error('Error: Unbalanced braces (missing closing braces)');
  process.exit(1);
}

console.log('CSS verification passed: Braces and comments are balanced.');
process.exit(0);
