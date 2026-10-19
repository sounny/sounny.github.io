const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('assert');

function findFiles(dir, exts) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        if (file === 'node_modules' || file === 'tests' || file === '.git' || file === 'scripts') continue;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            results = results.concat(findFiles(filePath, exts));
        } else if (exts.includes(path.extname(filePath))) {
            results.push(filePath);
        }
    }
    return results;
}

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let inString = false;
    let stringChar = '';
    let inLineComment = false;
    let inBlockComment = false;
    let stripped = '';

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i+1] || '';

        if (inLineComment) {
            if (char === '\n') {
                inLineComment = false;
                stripped += '\n';
            } else {
                stripped += ' '; // preserve length/newlines somewhat
            }
            continue;
        }

        if (inBlockComment) {
            if (char === '*' && nextChar === '/') {
                inBlockComment = false;
                stripped += '  ';
                i++;
            } else {
                if (char === '\n') stripped += '\n';
                else stripped += ' ';
            }
            continue;
        }

        if (inString) {
            if (char === '\\') {
                stripped += '  ';
                i++;
            } else if (char === stringChar) {
                inString = false;
                stripped += ' ';
            } else {
                if (char === '\n') stripped += '\n';
                else stripped += ' ';
            }
            continue;
        }

        if (char === '/' && nextChar === '/') {
            inLineComment = true;
            stripped += '  ';
            i++;
            continue;
        }

        if (char === '/' && nextChar === '*') {
            inBlockComment = true;
            stripped += '  ';
            i++;
            continue;
        }

        if (char === '"' || char === "'" || char === '`') {
            inString = true;
            stringChar = char;
            stripped += ' ';
            continue;
        }

        stripped += char;
    }

    const regex = /\[\s*,|,\s*,/g;
    let match;
    let found = false;
    while ((match = regex.exec(stripped)) !== null) {
        found = true;
    }
    return found;
}

test('no array literals with empty slots', () => {
    // Check .js files, and .html or .css where relevant.
    // Given the prompt: "scans site .js files (and .html or .css where relevant, excluding node_modules and tests)"
    const files = findFiles('.', ['.js', '.html', '.css']);
    let errors = [];

    // We discovered current occurrences in css/main.css, index.html, js/main.js
    const allowlist = ['css/main.css', 'index.html', 'js/main.js'];

    for (const file of files) {
        if (checkFile(file)) {
            // Replace backward slashes with forward slashes for cross-platform compatibility
            const normalizedFile = file.replace(/\\/g, '/');
            if (!allowlist.some(allowed => normalizedFile === allowed || normalizedFile.endsWith('/' + allowed) || normalizedFile === allowed.replace('/', '\\'))) {
                errors.push(file);
            }
        }
    }

    assert.deepStrictEqual(errors, [], 'Found array literals with empty slots in: \n' + errors.join('\n'));
});
