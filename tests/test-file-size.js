const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { execSync } = require('child_process');

// Files that are currently over 1MB
const ALLOWLIST = [];

test('No git-tracked files larger than 1 MB', () => {
  let gitOutput = '';
  try {
    gitOutput = execSync('git ls-files').toString().trim();
  } catch (error) {
    assert.fail('Failed to run git ls-files');
  }

  const files = gitOutput.split('\n').filter(Boolean);
  const MAX_SIZE = 1024 * 1024; // 1 MB
  const oversizedFiles = [];

  for (const file of files) {
    try {
      const stats = fs.statSync(file);
      if (stats.size > MAX_SIZE) {
        if (!ALLOWLIST.includes(file)) {
          oversizedFiles.push(`${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        }
      }
    } catch (e) {
      // Ignore files that git tracks but might be missing on disk
      // (e.g. symlinks or removed before commit)
    }
  }

  assert.strictEqual(
    oversizedFiles.length,
    0,
    `Found git-tracked files larger than 1 MB:\n${oversizedFiles.join('\n')}`
  );
});
