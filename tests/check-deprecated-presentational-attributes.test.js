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

function countDeprecatedAttributes(html) {
    let count = 0;

    let i = 0;
    while (i < html.length) {
        const start = html.indexOf('<', i);
        if (start === -1) break;

        if (html[start + 1] === '/' || html.startsWith('<!--', start)) {
            if (html.startsWith('<!--', start)) {
                i = html.indexOf('-->', start);
                if (i === -1) i = html.length;
                else i += 3;
            } else {
                i = html.indexOf('>', start);
                if (i === -1) i = html.length;
                else i += 1;
            }
            continue;
        }

        let end = start + 1;
        let inString = false;
        let stringChar = '';

        while (end < html.length) {
            const char = html[end];
            if (inString) {
                if (char === stringChar) {
                    inString = false;
                }
            } else {
                if (char === '"' || char === "'") {
                    inString = true;
                    stringChar = char;
                } else if (char === '>') {
                    break;
                }
            }
            end++;
        }

        if (end === html.length) break;

        const tagContent = html.slice(start + 1, end);

        const spaceIdx = tagContent.search(/\s/);
        let tagName = '';
        let attrsString = '';

        if (spaceIdx === -1) {
            tagName = tagContent;
        } else {
            tagName = tagContent.slice(0, spaceIdx);
            attrsString = tagContent.slice(spaceIdx);
        }

        tagName = tagName.toLowerCase();

        if (!/^[a-z0-9\-]+$/.test(tagName)) {
             i = end + 1;
             continue;
        }

        let j = 0;
        const attrs = new Set();
        while (j < attrsString.length) {
            while (j < attrsString.length && /[\s/]/.test(attrsString[j])) j++;
            if (j === attrsString.length) break;

            let attrStart = j;
            while (j < attrsString.length && !/[\s=>/"']/.test(attrsString[j])) j++;
            if (attrStart === j) {
                j++;
                continue;
            }

            const attrName = attrsString.slice(attrStart, j).toLowerCase();
            attrs.add(attrName);

            while (j < attrsString.length && /\s/.test(attrsString[j])) j++;

            if (j < attrsString.length && attrsString[j] === '=') {
                j++;
                while (j < attrsString.length && /\s/.test(attrsString[j])) j++;

                if (j < attrsString.length) {
                    const quote = attrsString[j];
                    if (quote === '"' || quote === "'") {
                        j++;
                        while (j < attrsString.length && attrsString[j] !== quote) j++;
                        if (j < attrsString.length) j++;
                    } else {
                        while (j < attrsString.length && !/[\s>]/.test(attrsString[j])) j++;
                    }
                }
            }
        }

        let hasDeprecated = false;
        if (attrs.has('align')) hasDeprecated = true;
        if (attrs.has('bgcolor')) hasDeprecated = true;
        if (attrs.has('valign')) hasDeprecated = true;
        if (tagName !== 'table' && attrs.has('border')) hasDeprecated = true;

        if (hasDeprecated) count++;

        i = end + 1;
    }

    return count;
}

test('Deprecated presentational attributes (align, bgcolor, border on non-table elements, valign) should not grow', (t) => {
    const htmlFiles = findHtmlFiles('.');
    let total = 0;
    const CURRENT_MAX = 0;

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        total += countDeprecatedAttributes(content);
    }

    assert.ok(total <= CURRENT_MAX, `Total count of deprecated presentational attributes (${total}) grew beyond baseline (${CURRENT_MAX})`);
});
