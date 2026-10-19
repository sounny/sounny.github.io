const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('assert');

// Files to check: .js and .html excluding node_modules and tests
function getFilesToCheck(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === 'node_modules' || item === 'tests' || item === '.git') {
      continue;
    }
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getFilesToCheck(fullPath, files);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

const ALLOWLIST = [];

function hasWithStatement(content) {
  let i = 0;
  const len = content.length;

  while (i < len) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '/' && nextChar === '/') {
      // Single line comment
      i += 2;
      while (i < len && content[i] !== '\n') {
        i++;
      }
    } else if (char === '/' && nextChar === '*') {
      // Multi line comment
      i += 2;
      while (i < len - 1 && !(content[i] === '*' && content[i + 1] === '/')) {
        i++;
      }
      i += 2; // skip */
    } else if (char === "'" || char === '"' || char === '`') {
      // String or template literal
      const quote = char;
      i++;
      while (i < len) {
        if (content[i] === '\\') {
          i += 2; // skip escaped char
        } else if (content[i] === quote) {
          i++;
          break;
        } else {
          i++;
        }
      }
    } else {
      // Not a comment or string
      // Check for 'with' followed by space/tab/newline and then '('
      // Or 'with(' directly.
      if (
        content[i] === 'w' &&
        content.substr(i, 4) === 'with'
      ) {
        // Need to make sure it's a standalone word (preceded by non-word char)
        const prevChar = i > 0 ? content[i - 1] : '';
        if (!/[a-zA-Z0-9_$]/.test(prevChar)) {
          let j = i + 4;
          // allow spaces
          while (j < len && /\s/.test(content[j])) {
            j++;
          }
          if (j < len && content[j] === '(') {
            return true;
          }
        }
      }
      i++;
    }
  }

  return false;
}

test('no with statements outside allowlist', () => {
  const files = getFilesToCheck(path.join(__dirname, '..'));
  const failures = [];

  for (const file of files) {
    const relPath = path.relative(path.join(__dirname, '..'), file);
    if (ALLOWLIST.includes(relPath)) {
      continue;
    }

    const content = fs.readFileSync(file, 'utf8');
    if (hasWithStatement(content)) {
      failures.push(relPath);
    }
  }

  assert.strictEqual(
    failures.length,
    0,
    `Found 'with' statement in files outside allowlist: ${failures.join(', ')}`
  );
});
