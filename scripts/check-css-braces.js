const fs = require('node:fs');
const path = require('node:path');

const cssPath = path.join(__dirname, '..', 'css', 'main.css');

if (!fs.existsSync(cssPath)) {
  process.stderr.write(`Error: Could not find ${cssPath}`);
  process.exit(1);
}

const content = fs.readFileSync(cssPath, 'utf8');

let braceCount = 0;
let lineNum = 1;
let colNum = 1;

for (let i = 0; i < content.length; i++) {
  const char = content[i];

  if (char === '{') {
    braceCount++;
  } else if (char === '}') {
    braceCount--;
    if (braceCount < 0) {
      process.stderr.write(`Error: Unbalanced curly braces in css/main.css. Unexpected '}' at line ${lineNum}, column ${colNum}`);
      process.exit(1);
    }
  } else if (char === '\n') {
    lineNum++;
    colNum = 0;
  }

  colNum++;
}

if (braceCount !== 0) {
  process.stderr.write(`Error: Unbalanced curly braces in css/main.css. Missing ${braceCount} '}' characters.`);
  process.exit(1);
}

console.info('css/main.css has balanced curly braces.');
