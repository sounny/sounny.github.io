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

function tokenizeHtml(html) {
    const tokens = [];
    let i = 0;
    while (i < html.length) {
        if (html[i] === '<') {
            if (html.startsWith('<!--', i)) {
                const end = html.indexOf('-->', i + 4);
                if (end !== -1) {
                    i = end + 3;
                    continue;
                }
            }
            if (html.startsWith('<!', i)) {
                const end = html.indexOf('>', i + 2);
                if (end !== -1) {
                    i = end + 1;
                    continue;
                }
            }
            let isClosing = false;
            let start = i + 1;
            if (html[start] === '/') {
                isClosing = true;
                start++;
            }
            let tagNameStart = start;
            while (start < html.length && /[a-zA-Z0-9\-]/.test(html[start])) {
                start++;
            }
            if (start > tagNameStart) {
                const tagName = html.slice(tagNameStart, start).toLowerCase();
                tokens.push({ type: 'tag', name: tagName, index: i });
            }
            // Skip the rest of the tag for now
            const end = html.indexOf('>', start);
            if (end !== -1) {
                i = end + 1;
                continue;
            }
        }
        i++;
    }
    return tokens;
}

const ALLOWLIST = [];

test('Check that HTML files do not contain <font> or <center> tags', () => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const tokens = tokenizeHtml(content);

        let hasOffendingTag = false;
        for (const token of tokens) {
            if (token.name === 'font' || token.name === 'center') {
                hasOffendingTag = true;
                break;
            }
        }

        if (hasOffendingTag && !ALLOWLIST.includes(file)) {
            offenders.push(file);
        }
    }

    assert.deepStrictEqual(
        offenders,
        [],
        'Found HTML files containing <font> or <center> tags. Please remove them or add to ALLOWLIST in tests/check-font-center.test.js'
    );
});
