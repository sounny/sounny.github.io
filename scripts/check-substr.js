const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ALLOWLIST = [];

function getAllFiles(dir, extArray, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'scripts' && file !== 'tests' && file !== 'test') {
        getAllFiles(filePath, extArray, fileList);
      }
    } else {
      if (extArray.includes(path.extname(file))) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

test('Check for deprecated .substr() usage', () => {
  const filesToCheck = getAllFiles('.', ['.js', '.html']);
  let foundSubstr = false;
  let errorMessages = [];

  for (const file of filesToCheck) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('.substr(')) {
        const occurrence = `${file}:${i + 1}`;
        if (!ALLOWLIST.includes(occurrence)) {
          foundSubstr = true;
          errorMessages.push(`Found .substr() in ${occurrence}: ${lines[i].trim()}`);
        }
      }
    }
  }

  assert.strictEqual(
    foundSubstr,
    false,
    `Found deprecated .substr() usage:\n${errorMessages.join('\n')}\nPlease use .slice() or .substring() instead.`
  );
});
