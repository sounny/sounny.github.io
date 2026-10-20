const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('assert');

// A simple tokenizer that yields a stream of operators and separators
function extractTokens(code) {
    let tokens = [];
    let inString = false;
    let stringChar = '';
    let inComment = false;
    let inMultiComment = false;

    let line = 1;
    let i = 0;
    while (i < code.length) {
        let char = code[i];

        if (char === '\n') {
            line++;
        }

        if (inString) {
            if (char === '\\') {
                i += 2;
                // handle multiline string line increment if needed
                if (code[i-1] === '\n') line++;
                continue;
            }
            if (char === stringChar) inString = false;
            i++;
            continue;
        }

        if (inComment) {
            if (char === '\n') inComment = false;
            i++;
            continue;
        }

        if (inMultiComment) {
            if (char === '*' && code[i + 1] === '/') {
                inMultiComment = false;
                i += 2;
                continue;
            }
            i++;
            continue;
        }

        if (char === "'" || char === '"' || char === '`') {
            inString = true;
            stringChar = char;
            i++;
            continue;
        }

        if (char === '/' && code[i + 1] === '/') {
            inComment = true;
            i += 2;
            continue;
        }

        if (char === '/' && code[i + 1] === '*') {
            inMultiComment = true;
            i += 2;
            continue;
        }

        // Operators
        if (char === '=' && code[i+1] === '=' && code[i+2] === '=') {
            tokens.push({ type: '===', line });
            i += 3;
            continue;
        }
        if (char === '=' && code[i+1] === '=') {
            tokens.push({ type: '==', line });
            i += 2;
            continue;
        }
        if (char === '!' && code[i+1] === '=' && code[i+2] === '=') {
            tokens.push({ type: '!==', line });
            i += 3;
            continue;
        }
        if (char === '!' && code[i+1] === '=') {
            tokens.push({ type: '!=', line });
            i += 2;
            continue;
        }

        // Logical boundaries. To evaluate compound expressions, we shouldn't separate by (, ), &&, ||
        // A "chain" usually means the statement level or block level.
        // We will separate on statement boundaries: ;, {, }, and perhaps \n if it acts as a statement boundary (basic).
        if ([';', '{', '}'].includes(char)) {
            tokens.push({ type: 'SEP', line });
            i++;
            continue;
        }

        i++;
    }

    return tokens;
}

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);

        // Skip specific directories early to avoid traversing them entirely
        if (['node_modules', '.git', 'tests', 'scripts'].includes(f)) {
            return;
        }

        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

function getJsFiles() {
    let jsFiles = [];
    walkDir('.', function(filePath) {
        if (filePath.endsWith('.js')) {
            jsFiles.push(filePath);
        }
    });
    return jsFiles;
}

function hasMixed(code) {
    let tokens = extractTokens(code);
    let chunks = [];
    let currentChunk = [];

    for (let t of tokens) {
        if (t.type === 'SEP') {
            if (currentChunk.length > 0) {
                chunks.push(currentChunk);
                currentChunk = [];
            }
        } else {
            currentChunk.push(t);
        }
    }
    if (currentChunk.length > 0) chunks.push(currentChunk);

    let issues = [];
    for (let chunk of chunks) {
        let hasEqEq = chunk.some(t => t.type === '==');
        let hasEqEqEq = chunk.some(t => t.type === '===');
        if (hasEqEq && hasEqEqEq) {
            issues.push(chunk[0].line);
        }

        let hasNotEq = chunk.some(t => t.type === '!=');
        let hasNotEqEq = chunk.some(t => t.type === '!==');
        if (hasNotEq && hasNotEqEq) {
            issues.push(chunk[0].line);
        }
    }
    return issues;
}

const allowlist = [];

test('No mixed == and === (or != and !==) in one expression chain', async (t) => {
    let jsFiles = getJsFiles();

    for (let file of jsFiles) {
        let content = fs.readFileSync(file, 'utf8');
        let issues = hasMixed(content);

        for (let line of issues) {
            let isAllowed = allowlist.some(a => a.file === file && a.line === line);
            if (!isAllowed) {
                assert.fail(`Mixed == and === (or != and !==) in one chain in ${file} on line ${line}`);
            }
        }
    }
});
