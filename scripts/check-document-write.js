const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert');

const ALLOWLIST = [
];

const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (file !== 'node_modules' && file !== 'tests' && file !== 'scripts' && !file.startsWith('.')) {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      if ((dirFile.endsWith('.js') || dirFile.endsWith('.html')) && !file.startsWith('.')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

test('No document.write or document.writeln', () => {
  const files = walkSync('.');
  const errors = [];

  for (const file of files) {
    if (ALLOWLIST.includes(file)) continue;

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('document.write') || line.includes('document.writeln')) {
        errors.push(`${file}:${i + 1}: Found document.write or document.writeln`);
      }
    }
  }

  if (errors.length > 0) {
    console.error(errors.join('\n'));
    assert.fail(`Found ${errors.length} instances of document.write or document.writeln`);
  }
});
