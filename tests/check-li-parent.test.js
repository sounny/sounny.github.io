const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

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

const ALLOWLIST = [
    // format: "path/to/file.html: <li>"
];

function checkLi(html, filePath) {
    let i = 0;
    const stack = [];
    const offenders = [];

    while (i < html.length) {
        let start = html.indexOf('<', i);
        if (start === -1) break;

        if (html.substring(start, start + 4) === '<!--') {
            let end = html.indexOf('-->', start);
            if (end === -1) break;
            i = end + 3;
            continue;
        }

        if (html.substring(start, start + 9).toLowerCase() === '<!doctype') {
            let end = html.indexOf('>', start);
            if (end === -1) break;
            i = end + 1;
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
            const isClosing = tagName.startsWith('/');
            const name = isClosing ? tagName.substring(1) : tagName;
            const isSelfClosing = tagContent.endsWith('/') ||
                ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'].includes(name);

            // Handle script, style, and svg tags by skipping their contents
            if (!isClosing && (name === 'script' || name === 'style' || name === 'svg')) {
                const closeTag = `</${name}>`;
                let nextClose = html.toLowerCase().indexOf(closeTag, end + 1);
                if (nextClose !== -1) {
                    i = nextClose + closeTag.length;
                    continue; // Skip the block entirely
                }
            }

            if (isClosing) {
                let k = stack.length - 1;
                while (k >= 0 && stack[k] !== name) k--;
                if (k >= 0) stack.length = k;
            } else {
                // p tags can be implicitly closed by several elements
                const pAutoCloseTags = ['address', 'article', 'aside', 'blockquote', 'details', 'div', 'dl', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'main', 'menu', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul', 'li'];
                if (pAutoCloseTags.includes(name) && stack.length > 0 && stack[stack.length - 1] === 'p') {
                    stack.pop();
                }

                if (name === 'li') {
                    // li tags can be implicitly closed by another li
                    if (stack.length > 0 && stack[stack.length - 1] === 'li') {
                        stack.pop();
                    }

                    const parent = stack.length > 0 ? stack[stack.length - 1] : null;
                    if (parent !== 'ul' && parent !== 'ol' && parent !== 'menu') {
                        const offenderStr = `${filePath}: ${html.substring(start, end + 1)}`;
                        if (!ALLOWLIST.includes(offenderStr)) {
                            offenders.push(offenderStr);
                        }
                    }
                }

                if (!isSelfClosing) {
                    stack.push(name);
                }
            }
        }
        i = end + 1;
    }
    return offenders;
}

test('Check <li> tags have ul, ol, or menu as parent', () => {
    const htmlFiles = findHtmlFiles('.');
    const allOffenders = [];

    for (const file of htmlFiles) {
        const html = fs.readFileSync(file, 'utf8');
        const normalizedFile = file.split(path.sep).join('/');
        const fileOffenders = checkLi(html, normalizedFile);
        allOffenders.push(...fileOffenders);
    }

    assert.deepStrictEqual(allOffenders, [], 'Found <li> elements that are not direct children of <ul>, <ol>, or <menu>. Please fix them or add to ALLOWLIST in tests/check-li-parent.test.js');
});
