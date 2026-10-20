const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert');

test('No .forEach(async...) with silently dropped promises', () => {
    function getAllFiles(dir, fileList = []) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                if (file !== 'node_modules' && file !== 'tests') {
                    getAllFiles(filePath, fileList);
                }
            } else {
                if (filePath.endsWith('.js') || filePath.endsWith('.html')) {
                    fileList.push(filePath);
                }
            }
        }
        return fileList;
    }

    const files = getAllFiles('.');
    let hasError = false;

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');

        let inSingleQuote = false;
        let inDoubleQuote = false;
        let inBacktick = false;
        let inLineComment = false;
        let inBlockComment = false;
        let inHtmlComment = false;

        let cleanedContent = '';

        for (let i = 0; i < content.length; i++) {
            const char = content[i];
            const nextChar = content[i+1];

            if (inLineComment) {
                if (char === '\n') {
                    inLineComment = false;
                    cleanedContent += char;
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
            if (inHtmlComment) {
                if (char === '-' && nextChar === '-' && content[i+2] === '>') {
                    inHtmlComment = false;
                    i += 2;
                }
                continue;
            }
            if (inSingleQuote) {
                if (char === '\\') i++;
                else if (char === "'") inSingleQuote = false;
                continue;
            }
            if (inDoubleQuote) {
                if (char === '\\') i++;
                else if (char === '"') inDoubleQuote = false;
                continue;
            }
            if (inBacktick) {
                if (char === '\\') i++;
                else if (char === '`') inBacktick = false;
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
            if (char === '<' && nextChar === '!' && content[i+2] === '-' && content[i+3] === '-') {
                inHtmlComment = true;
                i += 3;
                continue;
            }

            if (char === "'") { inSingleQuote = true; continue; }
            if (char === '"') { inDoubleQuote = true; continue; }
            if (char === '`') { inBacktick = true; continue; }

            cleanedContent += char;
        }

        const match = cleanedContent.match(/\.forEach\s*\(\s*async/);
        if (match) {
            const allowlist = []; // Populate with actual path if needed, we found no occurences when running manually earlier but we need it here.
            let allowed = false;
            for (const item of allowlist) {
                if (file === item || file.endsWith(item)) {
                    allowed = true;
                    break;
                }
            }

            if (!allowed) {
                console.error(`Found .forEach(async...) in ${file}`);
                hasError = true;
            }
        }
    }

    assert.strictEqual(hasError, false, 'Found .forEach(async...) with silently dropped promises');
});
