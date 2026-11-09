const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('assert');

// Reuse logic similar to check-img-dimensions.test.js
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

function extractAttributes(tagString) {
    const attrString = tagString.replace(/^<\/?\s*[a-zA-Z0-9\-_:]+/i, '').replace(/\/?>$/, '').trim();
    const attrs = {};
    const regex = /([a-zA-Z0-9\-_:]+)(?:\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|([^>\s]+)))?/gi;
    let match;
    while ((match = regex.exec(attrString)) !== null) {
        const name = match[1].toLowerCase();
        const value = match[2] !== undefined ? match[2] : (match[3] !== undefined ? match[3] : match[4]);
        attrs[name] = value === undefined ? '' : value;
    }
    return attrs;
}

test('img elements in index.html should have alt attributes', (t) => {
    const filePath = 'index.html';
    if (!fs.existsSync(filePath)) {
        return;
    }

    const html = fs.readFileSync(filePath, 'utf8');
    const tags = parseHtml(html);
    const warnings = [];

    for (const tag of tags) {
        if (tag.tagName === 'img') {
            const attrs = extractAttributes(tag.content);
            if (!('alt' in attrs)) {
                warnings.push(tag.content);
            }
        }
    }

    if (warnings.length > 0) {
        console.warn(`Found ${warnings.length} img elements missing an alt attribute in ${filePath}:`);
        warnings.forEach(w => console.warn(`  - ${w}`));
    }

    assert.strictEqual(
        warnings.length,
        0,
        `Found ${warnings.length} img elements missing an alt attribute in ${filePath}.`
    );
});
