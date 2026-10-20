const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

function getJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'tests' || file === '.git') {
      continue;
    }
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getJsFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function countStorageUsage(content) {
  let count = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplateLiteral = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (inSingleQuote) {
      if (char === '\\') i++; // escape
      else if (char === "'") inSingleQuote = false;
      continue;
    }

    if (inDoubleQuote) {
      if (char === '\\') i++; // escape
      else if (char === '"') inDoubleQuote = false;
      continue;
    }

    if (inTemplateLiteral) {
      if (char === '\\') i++; // escape
      else if (char === '`') inTemplateLiteral = false;
      continue;
    }

    if (char === '/' && nextChar === '/') {
      inLineComment = true;
      i++;
      continue;
    }

    if (char === '/' && nextChar === '*') {
      inBlockComment = true;
      i++;
      continue;
    }

    if (char === "'") {
      inSingleQuote = true;
      continue;
    }

    if (char === '"') {
      inDoubleQuote = true;
      continue;
    }

    if (char === '`') {
      inTemplateLiteral = true;
      continue;
    }

    // Checking for localStorage and sessionStorage
    if (content.startsWith('localStorage', i)) {
      count++;
      i += 11; // Length of localStorage - 1
    } else if (content.startsWith('sessionStorage', i)) {
      count++;
      i += 13; // Length of sessionStorage - 1
    }
  }

  return count;
}

test('Check for localStorage and sessionStorage references in JS files', (t) => {
  const rootDir = process.cwd();
  const jsFiles = getJsFiles(rootDir);

  let totalUsages = 0;

  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const fileUsages = countStorageUsage(content);
    totalUsages += fileUsages;
  }

  // Allowlist mapping file paths (relative to root) to their allowed occurrence counts.
  // We verified using grep that there are currently 0 usages in the codebase.
  const allowlist = {};

  let totalAllowed = 0;
  for (const count of Object.values(allowlist)) {
    totalAllowed += count;
  }

  if (totalUsages > totalAllowed) {
    assert.fail(`Found ${totalUsages} localStorage / sessionStorage references, but only ${totalAllowed} are allowed by the allowlist.`);
  } else {
    assert.ok(true, `Found ${totalUsages} localStorage / sessionStorage references, within the allowed limit of ${totalAllowed}.`);
  }
});
