const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('assert');

function getJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'tests' && file !== '.git') {
        getJsFiles(filePath, fileList);
      }
    } else if (filePath.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function findHasOwnProperty(content) {
  const issues = [];
  let i = 0;
  let line = 1;

  while (i < content.length) {
    if (content[i] === '\n') {
      line++;
      i++;
      continue;
    }

    // Line comment
    if (content[i] === '/' && content[i+1] === '/') {
      i += 2;
      while (i < content.length && content[i] !== '\n') {
        i++;
      }
      continue;
    }

    // Block comment
    if (content[i] === '/' && content[i+1] === '*') {
      i += 2;
      while (i < content.length) {
        if (content[i] === '*' && content[i+1] === '/') {
          i += 2;
          break;
        }
        if (content[i] === '\n') line++;
        i++;
      }
      continue;
    }

    // Strings
    if (content[i] === '"' || content[i] === "'" || content[i] === '`') {
      const quote = content[i];
      i++;
      while (i < content.length) {
        if (content[i] === '\\') {
          if (content[i+1] === '\n') {
            line++;
          }
          i += 2;
        } else if (content[i] === '\n') {
          line++;
          i++;
        } else if (content[i] === quote) {
          i++;
          break;
        } else {
          i++;
        }
      }
      continue;
    }

    // Match .hasOwnProperty(
    if (content.startsWith('.hasOwnProperty', i)) {
      let isParenAfter = false;
      let k = i + 15;
      while (k < content.length && (content[k] === ' ' || content[k] === '\t' || content[k] === '\r' || content[k] === '\n')) {
        k++;
      }
      if (k < content.length && content[k] === '(') {
        isParenAfter = true;
      }

      if (isParenAfter) {
        issues.push(line);
      }
      i += 15; // Skip the length of .hasOwnProperty
      continue;
    }

    i++;
  }
  return issues;
}

// Allowlist mapping relative file path to array of allowed line numbers
const allowlist = {
  // Add occurrences here if necessary
};

test('No obj.hasOwnProperty(...) calls in .js files', () => {
  const jsFiles = getJsFiles(process.cwd());
  let failed = false;
  let errors = [];

  for (const file of jsFiles) {
    const relPath = path.relative(process.cwd(), file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');
    const issues = findHasOwnProperty(content);

    if (issues.length > 0) {
      const allowedLines = allowlist[relPath] || [];
      const unallowed = issues.filter(line => !allowedLines.includes(line));

      if (unallowed.length > 0) {
        failed = true;
        for (const line of unallowed) {
          errors.push(`Found hasOwnProperty call at ${relPath}:${line}. Use Object.hasOwn or Object.prototype.hasOwnProperty.call instead.`);
        }
      }
    }
  }

  if (failed) {
    assert.fail(errors.join('\n'));
  }
});
