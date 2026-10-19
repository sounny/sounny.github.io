const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert');

const ALLOWLIST = {
  // If there are files with legitimate markers, list them here using forward slashes.
  // For example: 'docs/some-file.html': [line_number_or_something]
};

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      // Exclude node_modules and tests directories
      if (f !== 'node_modules' && f !== 'tests') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

test('no git merge conflict markers in .js and .html files', () => {
  const rootDir = path.resolve(__dirname, '..');
  let hasError = false;
  let errors = [];

  walkDir(rootDir, (filePath) => {
    if (!filePath.endsWith('.js') && !filePath.endsWith('.html')) return;

    // Normalize path to use forward slashes for cross-platform compatibility
    let relativePath = path.relative(rootDir, filePath).split(path.sep).join('/');

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Look for lines starting with <<<<<<<, =======, or >>>>>>>
      if (line.startsWith('<<<<<<<') || line.startsWith('=======') || line.startsWith('>>>>>>>')) {

        // Check if this occurrence is allowlisted
        const allowed = ALLOWLIST[relativePath];
        if (allowed && allowed.includes(index + 1)) {
           return; // Allowlisted
        }

        hasError = true;
        errors.push(`${relativePath}:${index + 1}: ${line}`);
      }
    });
  });

  if (hasError) {
    assert.fail(`Found git merge conflict markers:\n${errors.join('\n')}`);
  }
});
