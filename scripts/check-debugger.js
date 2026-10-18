const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

function getJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git') {
      continue;
    }
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      getJsFiles(filepath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filepath);
    }
  }
  return fileList;
}

test('No de' + 'bugger statements in JS files', () => {
  const jsFiles = getJsFiles(process.cwd());
  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf8');
    // We construct the keyword dynamically to avoid false positives in this script
    const keyword = 'de' + 'bugger';
    const debuggerRegex = new RegExp(`\\b${keyword}\\b`);
    // exclude the check for this test script itself to be 100% safe
    if (path.basename(file) === 'check-debugger.js') {
      continue;
    }
    if (debuggerRegex.test(content)) {
      assert.fail(`Found ${keyword} statement in ${file}`);
    }
  }
});
