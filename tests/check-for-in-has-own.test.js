const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('assert');

// Allowlist for known occurrences
const allowlist = {};

function countUncheckedForIn(content) {
    let occurrences = 0;

    // We will collect tokens that are not comments or strings
    // to search for 'for', '(', 'in', ')', '{', '}' and 'hasOwnProperty' / 'Object.hasOwn'

    // Actually, it's better to do a state machine and parse tokens
    const tokens = [];
    let i = 0;
    const len = content.length;

    while (i < len) {
        if (content[i] === '/' && content[i+1] === '*') {
            i += 2;
            while (i < len && !(content[i] === '*' && content[i+1] === '/')) i++;
            i += 2;
            continue;
        }
        if (content[i] === '/' && content[i+1] === '/') {
            i += 2;
            while (i < len && content[i] !== '\n') i++;
            continue;
        }
        if (content[i] === "'" || content[i] === '"' || content[i] === '`') {
            const quote = content[i];
            i++;
            while (i < len) {
                if (content[i] === '\\') i += 2;
                else if (content[i] === quote) { i++; break; }
                else i++;
            }
            continue;
        }

        if (/[a-zA-Z0-9_$]/.test(content[i])) {
            let start = i;
            while (i < len && /[a-zA-Z0-9_$]/.test(content[i])) i++;
            tokens.push({ type: 'identifier', value: content.substring(start, i), index: start });
            continue;
        }

        if (!/\s/.test(content[i])) {
            tokens.push({ type: 'punctuator', value: content[i], index: i });
        }

        i++;
    }

    let t = 0;
    while (t < tokens.length) {
        if (tokens[t].type === 'identifier' && tokens[t].value === 'for') {
            if (t + 1 < tokens.length && tokens[t+1].value === '(') {
                let parenDepth = 1;
                let hasIn = false;
                let h = t + 2;
                while (h < tokens.length && parenDepth > 0) {
                    if (tokens[h].value === '(') parenDepth++;
                    else if (tokens[h].value === ')') parenDepth--;
                    else if (parenDepth === 1 && tokens[h].type === 'identifier' && tokens[h].value === 'in') {
                        hasIn = true;
                    }
                    h++;
                }

                if (parenDepth === 0 && hasIn) {
                    // found a for...in loop
                    // now parse its body
                    let bodyStart = h;
                    let b = bodyStart;
                    let hasHasOwn = false;

                    if (b < tokens.length && tokens[b].value === '{') {
                        let braceDepth = 1;
                        b++;
                        while (b < tokens.length && braceDepth > 0) {
                            if (tokens[b].value === '{') braceDepth++;
                            else if (tokens[b].value === '}') braceDepth--;

                            if (braceDepth > 0 && tokens[b].type === 'identifier' && (tokens[b].value === 'hasOwnProperty' || tokens[b].value === 'hasOwn')) {
                                hasHasOwn = true;
                            }
                            b++;
                        }
                    } else {
                        // single statement body
                        while (b < tokens.length && tokens[b].value !== ';' && tokens[b].value !== '}') {
                            if (tokens[b].type === 'identifier' && (tokens[b].value === 'hasOwnProperty' || tokens[b].value === 'hasOwn')) {
                                hasHasOwn = true;
                            }
                            b++;
                        }
                        if (b < tokens.length && tokens[b].value === ';') b++;
                    }

                    if (!hasHasOwn) {
                        occurrences++;
                    }

                    t = b - 1; // move to end of body
                }
            }
        }
        t++;
    }

    return occurrences;
}

function findJsFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== 'tests' && !file.startsWith('.')) {
                findJsFiles(filePath, fileList);
            }
        } else if (stat.isFile() && filePath.endsWith('.js')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

test('Check for for-in loops without hasOwnProperty/Object.hasOwn', () => {
    const rootDir = path.resolve(__dirname, '..');
    const jsFiles = findJsFiles(rootDir);

    for (const file of jsFiles) {
        const relativePath = path.relative(rootDir, file).replace(/\\/g, '/');
        const content = fs.readFileSync(file, 'utf8');
        const occurrences = countUncheckedForIn(content);

        const allowedCount = allowlist[relativePath] || 0;

        if (occurrences > allowedCount) {
            assert.fail(`File ${relativePath} contains ${occurrences} for-in loop(s) that do not check hasOwnProperty/Object.hasOwn, but only ${allowedCount} are allowed.`);
        }
    }
});