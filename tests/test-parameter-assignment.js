const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = {};

function getJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'tests' || file === '.git' || file === 'scripts') {
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

function tokenize(code) {
  let i = 0;
  const tokens = [];
  while (i < code.length) {
    const c = code[i];
    if (c === '/' && code[i + 1] === '/') {
      let start = i;
      while (i < code.length && code[i] !== '\n') i++;
      // Skip comment
    } else if (c === '/' && code[i + 1] === '*') {
      let start = i;
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i += 2;
      // Skip comment
    } else if (c === '"' || c === "'" || c === '`') {
      let start = i;
      let quote = c;
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
      tokens.push({ type: 'string', value: code.substring(start, i), index: start });
    } else if (/[a-zA-Z_$]/.test(c)) {
      let start = i;
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) i++;
      tokens.push({ type: 'identifier', value: code.substring(start, i), index: start });
    } else if (/\s/.test(c)) {
      i++;
    } else {
      let len = 1;
      if (code.startsWith('===', i) || code.startsWith('!==', i) || code.startsWith('<<=', i) || code.startsWith('>>=', i) || code.startsWith('>>>=', i)) len = 3;
      else if (code.startsWith('==', i) || code.startsWith('!=', i) || code.startsWith('<=', i) || code.startsWith('>=', i) || code.startsWith('&&', i) || code.startsWith('||', i) || code.startsWith('=>', i) || code.startsWith('+=', i) || code.startsWith('-=', i) || code.startsWith('*=', i) || code.startsWith('/=', i) || code.startsWith('%=', i) || code.startsWith('&=', i) || code.startsWith('|=', i) || code.startsWith('^=', i) || code.startsWith('++', i) || code.startsWith('--', i)) len = 2;

      tokens.push({ type: 'punctuator', value: code.substring(i, i + len), index: i });
      i += len;
    }
  }
  return tokens;
}

function countParameterAssignments(code) {
  const tokens = tokenize(code);
  let assignmentsCount = 0;

  let i = 0;
  while (i < tokens.length) {
    if (tokens[i].type === 'identifier' && tokens[i].value === 'function') {
      let params = [];
      i++;
      if (i < tokens.length && tokens[i].type === 'identifier') {
        i++; // skip function name
      }
      if (i < tokens.length && tokens[i].value === '(') {
        i++;
        let pDepth = 1;
        while (i < tokens.length && pDepth > 0) {
          if (tokens[i].value === '(') pDepth++;
          else if (tokens[i].value === ')') pDepth--;
          else if (pDepth === 1 && tokens[i].type === 'identifier') {
            params.push(tokens[i].value);
          }
          i++;
        }

        if (i < tokens.length && tokens[i].value === '{') {
          assignmentsCount += scanFunctionBody(tokens, i, params);
        }
      }
    } else if (tokens[i].type === 'identifier' && tokens[i+1] && tokens[i+1].value === '=>') {
       let params = [tokens[i].value];
       i += 2;
       if (i < tokens.length && tokens[i].value === '{') {
          assignmentsCount += scanFunctionBody(tokens, i, params);
       } else {
          assignmentsCount += scanFunctionBodyArrow(tokens, i, params);
       }
    } else if (tokens[i].value === '(') {
       let j = i + 1;
       let pDepth = 1;
       let possibleParams = [];
       while (j < tokens.length && pDepth > 0) {
          if (tokens[j].value === '(') pDepth++;
          else if (tokens[j].value === ')') pDepth--;
          else if (pDepth === 1 && tokens[j].type === 'identifier') {
             possibleParams.push(tokens[j].value);
          }
          j++;
       }
       if (j < tokens.length && tokens[j].value === '=>') {
          i = j + 1;
          if (i < tokens.length && tokens[i].value === '{') {
             assignmentsCount += scanFunctionBody(tokens, i, possibleParams);
          } else {
             assignmentsCount += scanFunctionBodyArrow(tokens, i, possibleParams);
          }
       } else {
          i++;
       }
    } else {
      i++;
    }
  }
  return assignmentsCount;
}

function scanFunctionBody(tokens, startIdx, params) {
  if (params.length === 0) return 0;

  let bDepth = 1;
  let i = startIdx + 1;
  let assignments = 0;
  const assignOps = ['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '>>>='];

  while (i < tokens.length && bDepth > 0) {
    if (tokens[i].value === '{') bDepth++;
    else if (tokens[i].value === '}') bDepth--;
    else if (tokens[i].type === 'identifier' && params.includes(tokens[i].value)) {
      if (i > 0 && (tokens[i-1].value === '++' || tokens[i-1].value === '--')) {
         assignments++;
      } else if (i + 1 < tokens.length && (tokens[i+1].value === '++' || tokens[i+1].value === '--')) {
         assignments++;
      } else if (i + 1 < tokens.length && assignOps.includes(tokens[i+1].value)) {
         assignments++;
      }
    }
    i++;
  }
  return assignments;
}

function scanFunctionBodyArrow(tokens, startIdx, params) {
  if (params.length === 0) return 0;

  let i = startIdx;
  let assignments = 0;
  const assignOps = ['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '>>>='];

  // Single expression arrow function, scan until comma, semicolon, or closing paren/brace that doesn't match an opening one we saw
  let pDepth = 0;
  let bDepth = 0;
  while (i < tokens.length) {
    if (tokens[i].value === '(') pDepth++;
    else if (tokens[i].value === ')') {
        if (pDepth === 0) break;
        pDepth--;
    } else if (tokens[i].value === '{') bDepth++;
    else if (tokens[i].value === '}') {
        if (bDepth === 0) break;
        bDepth--;
    } else if (pDepth === 0 && bDepth === 0 && (tokens[i].value === ',' || tokens[i].value === ';')) {
        break;
    } else if (tokens[i].type === 'identifier' && params.includes(tokens[i].value)) {
      if (i > 0 && (tokens[i-1].value === '++' || tokens[i-1].value === '--')) {
         assignments++;
      } else if (i + 1 < tokens.length && (tokens[i+1].value === '++' || tokens[i+1].value === '--')) {
         assignments++;
      } else if (i + 1 < tokens.length && assignOps.includes(tokens[i+1].value)) {
         assignments++;
      }
    }
    i++;
  }
  return assignments;
}

test('limit assignments to function parameter names', () => {
  const rootDir = path.resolve(__dirname, '..');
  const jsFiles = getJsFiles(rootDir);

  for (const file of jsFiles) {
    const code = fs.readFileSync(file, 'utf8');
    const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
    const count = countParameterAssignments(code);
    const allowed = ALLOWLIST[relPath] || 0;

    assert.ok(
      count <= allowed,
      `File ${relPath} has ${count} assignments to function parameters, which exceeds the allowed ${allowed}.`
    );
  }
});
