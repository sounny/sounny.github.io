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

const CURRENT_COUNT = 0;

test('Check for input/select/textarea elements inside forms without a name attribute', () => {
    const htmlFiles = findHtmlFiles('.');
    let missingNameCount = 0;

    for (const file of htmlFiles) {
        const html = fs.readFileSync(file, 'utf8');
        const tags = parseHtml(html);

        let inForm = false;
        for (const tag of tags) {
            if (tag.tagName === 'form') {
                inForm = true;
            } else if (tag.tagName === '/form') {
                inForm = false;
            } else if (inForm && ['input', 'select', 'textarea'].includes(tag.tagName)) {
                const attrs = extractAttributes(tag.content);

                if (!attrs.hasOwnProperty('name')) {
                    missingNameCount++;
                }
            }
        }
    }

    assert.ok(missingNameCount <= CURRENT_COUNT, `Found ${missingNameCount} elements inside a form without a name attribute, which exceeds the baseline of ${CURRENT_COUNT}`);
});
