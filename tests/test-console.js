const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert');

// Allowlist of files and the number of allowed console.log/console.debug calls.
// Example: { 'js/main.js': 2 }
const ALLOWLIST = {};

const ALLOWED_COUNT = Object.values(ALLOWLIST).reduce((sum, count) => sum + count, 0);

function stripStringsAndComments(code) {
  let result = '';
  let i = 0;
  while (i < code.length) {
    if (code[i] === '/' && code[i+1] === '/') {
      while (i < code.length && code[i] !== '\n') i++;
      result += '\n';
    } else if (code[i] === '/' && code[i+1] === '*') {
      i += 2;
      while (i < code.length - 1 && !(code[i] === '*' && code[i+1] === '/')) i++;
      i += 2;
    } else if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
      const quote = code[i];
      i++;
      while (i < code.length) {
        if (code[i] === '\\') {
          i += 2;
        } else if (code[i] === quote) {
          i++;
          break;
        } else {
          i++;
        }
      }
    } else {
      result += code[i];
      i++;
    }
  }
  return result;
}

function countConsole(code) {
  const stripped = stripStringsAndComments(code);
  const regex = /\bconsole\s*\.\s*(log|debug)\b/g;
  const matches = stripped.match(regex);
  return matches ? matches.length : 0;
}

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    const basename = path.basename(p);
    if (basename === 'node_modules' || basename === 'tests' || basename === '.git') {
      continue;
    }
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      walk(p, callback);
    } else if (p.endsWith('.js')) {
      callback(p);
    }
  }
}

test('Limit console.log and console.debug calls', () => {
  let total = 0;
  const rootDir = path.resolve(__dirname, '..');
  walk(rootDir, (file) => {
    const code = fs.readFileSync(file, 'utf8');
    const count = countConsole(code);
    if (count > 0) {
      const relativePath = path.relative(rootDir, file).replace(/\\/g, '/');
      const allowed = ALLOWLIST[relativePath] || 0;
      assert.ok(count <= allowed, `File ${relativePath} has ${count} console.log/debug calls, but only ${allowed} are allowed.`);
    }
    total += count;
  });

  assert.ok(total <= ALLOWED_COUNT, `Found ${total} console.log/console.debug calls, which exceeds the allowed maximum of ${ALLOWED_COUNT}.`);
});
