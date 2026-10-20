const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('assert');

function tokenize(code) {
    let i = 0;
    const tokens = [];
    while (i < code.length) {
        if (code.startsWith('//', i)) {
            while (i < code.length && code[i] !== '\n') i++;
            continue;
        }
        if (code.startsWith('/*', i)) {
            i += 2;
            while (i < code.length && !code.startsWith('*/', i)) i++;
            i += 2;
            continue;
        }
        const char = code[i];
        if (char === '"' || char === "'" || char === '`') {
            const quote = char;
            let j = i + 1;
            while (j < code.length) {
                if (code[j] === '\\') {
                    j += 2;
                    continue;
                }
                if (code[j] === quote) {
                    j++;
                    break;
                }
                j++;
            }
            tokens.push({ type: 'string', value: code.substring(i, j) });
            i = j;
            continue;
        }
        if (/[a-zA-Z_$]/.test(char)) {
            let j = i + 1;
            while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) j++;
            tokens.push({ type: 'identifier', value: code.substring(i, j) });
            i = j;
            continue;
        }
        if (/\s/.test(char)) {
            i++;
            continue;
        }
        // punct
        let len = 1;
        if (code.startsWith('=>', i)) len = 2;
        else if (code.startsWith('===', i) || code.startsWith('!==', i)) len = 3;
        else if (code.startsWith('==', i) || code.startsWith('!=', i) || code.startsWith('<=', i) || code.startsWith('>=', i) || code.startsWith('&&', i) || code.startsWith('||', i)) len = 2;

        tokens.push({ type: 'punctuator', value: code.substring(i, i + len) });
        i += len;
    }
    return tokens;
}

function findAsyncFunctionsWithoutAwait(code) {
    const tokens = tokenize(code);
    const asyncFunctions = [];

    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].value === 'async') {
            let isAsyncFunc = false;
            let parenLevel = 0;
            let j = i + 1;
            let bodyStart = -1;

            const next = tokens[j]?.value;
            if (!next) continue;
            if (next !== 'function' && next !== '(' && !/^[a-zA-Z_$]/.test(next)) {
                continue;
            }

            while (j < tokens.length) {
                const t = tokens[j].value;
                if (parenLevel === 0 && (t === ';' || t === '=')) {
                    break;
                }
                if (t === '(') parenLevel++;
                else if (t === ')') parenLevel--;
                else if (parenLevel === 0) {
                    if (t === '{') {
                        bodyStart = j;
                        isAsyncFunc = true;
                        break;
                    } else if (t === '=>') {
                        if (j + 1 < tokens.length && tokens[j + 1].value === '{') {
                            bodyStart = j + 1;
                            isAsyncFunc = true;
                            break;
                        } else {
                            bodyStart = j + 1;
                            isAsyncFunc = true;
                            break;
                        }
                    }
                }
                j++;
            }

            if (!isAsyncFunc || bodyStart === -1) continue;

            let bodyEnd = tokens.length;
            let k = bodyStart;
            if (tokens[bodyStart].value === '{') {
                let bl = 0;
                while (k < tokens.length) {
                    if (tokens[k].value === '{') bl++;
                    else if (tokens[k].value === '}') {
                        bl--;
                        if (bl === 0) {
                            bodyEnd = k;
                            break;
                        }
                    }
                    k++;
                }
            } else {
                let nesting = 0;
                while (k < tokens.length) {
                    const t = tokens[k].value;
                    if (t === '(' || t === '[' || t === '{') nesting++;
                    else if (t === ')' || t === ']' || t === '}') {
                        if (nesting === 0) {
                            bodyEnd = k - 1;
                            break;
                        }
                        nesting--;
                    }
                    else if (nesting === 0 && (t === ',' || t === ';')) {
                        bodyEnd = k - 1;
                        break;
                    }
                    k++;
                }
                if (k === tokens.length) bodyEnd = k - 1;
            }

            asyncFunctions.push({ start: bodyStart, end: bodyEnd, hasAwait: false });
        }
    }

    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].value === 'await') {
            let innermost = null;
            for (const f of asyncFunctions) {
                if (i >= f.start && i <= f.end) {
                    if (!innermost || (f.start >= innermost.start && f.end <= innermost.end)) {
                        innermost = f;
                    }
                }
            }
            if (innermost) {
                innermost.hasAwait = true;
            }
        }
    }

    return asyncFunctions.filter(f => !f.hasAwait).length;
}

function getJsFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === 'tests' || file.startsWith('.')) continue;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            getJsFiles(filePath, fileList);
        } else if (file.endsWith('.js')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

test('no async functions without await', () => {
    const jsFiles = getJsFiles(process.cwd());
    let totalWithoutAwait = 0;

    for (const file of jsFiles) {
        const code = fs.readFileSync(file, 'utf8');
        const count = findAsyncFunctionsWithoutAwait(code);
        if (count > 0) {
            totalWithoutAwait += count;
        }
    }

    const ALLOWLIST_COUNT = 0; // Update if current codebase has any
    assert.ok(totalWithoutAwait <= ALLOWLIST_COUNT, `Found ${totalWithoutAwait} async functions without await. Expected at most ${ALLOWLIST_COUNT}.`);
});
