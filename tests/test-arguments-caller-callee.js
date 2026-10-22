const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('assert');

// Allowlist for current occurrences
const allowlist = [];

function checkFileForArguments(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    let i = 0;
    const len = content.length;
    let occurrences = 0;

    while (i < len) {
        // Skip block comments
        if (content[i] === '/' && content[i+1] === '*') {
            i += 2;
            while (i < len && !(content[i] === '*' && content[i+1] === '/')) {
                i++;
            }
            i += 2;
            continue;
        }

        // Skip line comments
        if (content[i] === '/' && content[i+1] === '/') {
            i += 2;
            while (i < len && content[i] !== '\n') {
                i++;
            }
            continue;
        }

        // Skip strings and template literals
        if (content[i] === "'" || content[i] === '"' || content[i] === '`') {
            const quote = content[i];
            i++;
            while (i < len) {
                if (content[i] === '\\') {
                    i += 2; // skip escaped character
                } else if (content[i] === quote) {
                    i++;
                    break;
                } else {
                    i++;
                }
            }
            continue;
        }

        // Check for 'arguments.callee' or 'arguments.caller'
        if (content.substring(i, i + 16) === 'arguments.callee' || content.substring(i, i + 16) === 'arguments.caller') {
            const isCallee = content.substring(i, i + 16) === 'arguments.callee';
            // Check if it's a word boundary
            const before = i === 0 ? true : /[^a-zA-Z0-9_$]/.test(content[i - 1]);
            if (before) {
                let j = i + 16;
                const afterChar = content[j];
                const after = j >= len ? true : /[^a-zA-Z0-9_$]/.test(afterChar);
                if (after) {
                    occurrences++;
                    i = j; // Skip past it
                    continue;
                }
            }
        }

        i++;
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

test('Check for arguments.callee and arguments.caller in .js files', () => {
    const jsFiles = findJsFiles(process.cwd());
    for (const file of jsFiles) {
        const relativePath = path.relative(process.cwd(), file);
        const occurrences = checkFileForArguments(file);

        if (occurrences > 0) {
            const allowed = allowlist.includes(relativePath);
            assert.ok(allowed, `File ${relativePath} contains ${occurrences} 'arguments.callee' or 'arguments.caller' reference(s).`);
        }
    }
});
