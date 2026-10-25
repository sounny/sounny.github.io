const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert');

function findHtmlFiles(dir) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findHtmlFiles(fullPath));
        } else if (fullPath.endsWith('.html')) {
            results.push(fullPath);
        }
    }
    return results;
}

function parseHtml(html) {
    const tags = [];
    let i = 0;
    while (i < html.length) {
        let start = html.indexOf('<', i);
        if (start === -1) break;

        if (html.substring(start, start + 4) === '<!--') {
            let end = html.indexOf('-->', start);
            if (end === -1) break;
            i = end + 3;
            continue;
        }

        let end = html.indexOf('>', start);
        if (end === -1) break;

        let inSingleQuote = false;
        let inDoubleQuote = false;
        for (let j = start + 1; j < html.length; j++) {
            const char = html[j];
            if (char === "'" && !inDoubleQuote) inSingleQuote = !inSingleQuote;
            if (char === '"' && !inSingleQuote) inDoubleQuote = !inDoubleQuote;
            if (char === '>' && !inSingleQuote && !inDoubleQuote) {
                end = j;
                break;
            }
        }

        const tagContent = html.substring(start + 1, end);
        const match = tagContent.match(/^(\/?[a-zA-Z0-9\-_:]+)/);
        if (match) {
            const tagName = match[1].toLowerCase();
            tags.push({
                tagName,
                content: html.substring(start, end + 1),
                start,
                end: end + 1
            });
        }
        i = end + 1;
    }
    return tags;
}

const ALLOWLIST = [
    // Format: "path/to/file.html: <ul...>"
];

test('Check that no ul or ol elements have zero li children', () => {
    const htmlFiles = findHtmlFiles('.');
    let totalEmpty = 0;
    let offenders = [];

    for (const file of htmlFiles) {
        const html = fs.readFileSync(file, 'utf8');
        const tags = parseHtml(html);
        const stack = [];

        for (const tag of tags) {
            if (tag.tagName === 'ul' || tag.tagName === 'ol') {
                stack.push({ tagName: tag.tagName, hasLi: false, str: tag.content });
            } else if (tag.tagName === 'li') {
                if (stack.length > 0) {
                    stack[stack.length - 1].hasLi = true;
                }
            } else if (tag.tagName === '/ul' || tag.tagName === '/ol') {
                const expected = tag.tagName.substring(1);
                for (let i = stack.length - 1; i >= 0; i--) {
                    if (stack[i].tagName === expected) {
                        const popped = stack.splice(i, 1)[0];
                        if (!popped.hasLi) {
                            const offenderStr = `${file}: ${popped.str}`;
                            if (!ALLOWLIST.includes(offenderStr)) {
                                offenders.push(offenderStr);
                                totalEmpty++;
                            }
                        }
                        break;
                    }
                }
            }
        }
    }

    assert.deepStrictEqual(offenders, [], 'Found empty ul or ol elements (without li children). Please remove them or add to ALLOWLIST in tests/check-empty-lists.test.js');
});
