const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Allowlist mapping file paths to the number of allowed `return await` statements outside `try` blocks.
const ALLOWLIST = {
};

// Simplified tokenizer
function tokenize(code) {
  const tokens = [];
  let i = 0;
  while (i < code.length) {
    const char = code[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Single-line comment
    if (char === '/' && code[i + 1] === '/') {
      i += 2;
      while (i < code.length && code[i] !== '\n') i++;
      continue;
    }

    // Multi-line comment
    if (char === '/' && code[i + 1] === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        i++;
      }
      i += 2;
      continue;
    }

    // Strings
    if (char === '"' || char === "'") {
      const quote = char;
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === '\\') i += 2;
        else i++;
      }
      i++; // Skip closing quote
      continue;
    }

    // Template literals
    if (char === '`') {
      i++;
      while (i < code.length && code[i] !== '`') {
        if (code[i] === '\\') i += 2;
        else i++;
      }
      i++; // Skip closing backtick
      continue;
    }

    // Identifiers and Keywords
    if (/[a-zA-Z_$]/.test(char)) {
      let identifier = '';
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
        identifier += code[i];
        i++;
      }
      tokens.push({ type: 'identifier', value: identifier });
      continue;
    }

    // Punctuation
    tokens.push({ type: 'punctuation', value: char });
    i++;
  }
  return tokens;
}

// Find all .js files recursively
function getJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('tests') && !file.includes('.git')) {
        results = results.concat(getJsFiles(file));
      }
    } else {
      if (file.endsWith('.js') && !file.includes('node_modules') && !file.includes('tests')) {
        results.push(file);
      }
    }
  });
  return results;
}

test('no return await outside try block', () => {
  const rootDir = process.cwd();
  const jsFiles = getJsFiles(rootDir);
  let totalViolations = 0;

  const currentTotalViolations = Object.values(ALLOWLIST).reduce((a, b) => a + b, 0);

  jsFiles.forEach(file => {
    const code = fs.readFileSync(file, 'utf8');
    const tokens = tokenize(code);

    let braceDepth = 0;
    const tryBlockDepths = [];
    let fileViolations = 0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === 'punctuation' && token.value === '{') {
        braceDepth++;
      }

      if (token.type === 'punctuation' && token.value === '}') {
        braceDepth--;
        if (tryBlockDepths.length > 0 && braceDepth < tryBlockDepths[tryBlockDepths.length - 1]) {
           tryBlockDepths.pop();
        }
      }

      if (token.type === 'identifier' && token.value === 'try') {
         // Find the next '{' to mark the depth of the try block
         let j = i + 1;
         let foundBrace = false;
         while(j < tokens.length) {
            if (tokens[j].type === 'punctuation' && tokens[j].value === '{') {
                 // Try block effectively starts at the *next* brace depth
                 tryBlockDepths.push(braceDepth + 1);
                 foundBrace = true;
                 break;
            } else if (tokens[j].type === 'identifier' || (tokens[j].type === 'punctuation' && tokens[j].value !== '{')) {
                // Ignore other tokens before '{' for simplicity, or handle cases if it's strange.
            }
            j++;
         }
      }

      if (token.type === 'identifier' && token.value === 'return') {
        if (i + 1 < tokens.length && tokens[i + 1].type === 'identifier' && tokens[i + 1].value === 'await') {
           if (tryBlockDepths.length === 0) {
              fileViolations++;
              totalViolations++;
           }
        }
      }
    }

    const relPath = path.relative(rootDir, file);
    const allowed = ALLOWLIST[relPath] || 0;

    if (fileViolations > allowed) {
       assert.fail(`File ${relPath} has ${fileViolations} 'return await' outside try block(s), but only ${allowed} are allowed.`);
    }
  });

  if (totalViolations > currentTotalViolations) {
     assert.fail(`Total 'return await' outside try block(s) count (${totalViolations}) exceeds the allowed count (${currentTotalViolations}).`);
  }
});
