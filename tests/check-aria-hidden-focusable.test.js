const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else {
        const ext = path.extname(file).toLowerCase();
        if (ext === '.html') {
          fileList.push(filePath);
        }
    }
  }
  return fileList;
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

const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const focusableTags = new Set(['button', 'input', 'select', 'textarea']);

const allowlist = [];

test('focusable elements must not be contained within aria-hidden="true"', () => {
    const htmlFiles = findHtmlFiles('.');
    let hasErrors = false;

    for (let file of htmlFiles) {
        const html = fs.readFileSync(file, 'utf8');
        const tags = parseHtml(html);
        const stack = [];

        // Normalize path for cross-platform keys in allowlist
        file = file.split(path.sep).join('/');

        for (const tag of tags) {
            const isClosing = tag.tagName.startsWith('/');
            const tagName = isClosing ? tag.tagName.substring(1) : tag.tagName;

            if (isClosing) {
                // Pop until we find the opening tag
                let foundIndex = -1;
                for (let j = stack.length - 1; j >= 0; j--) {
                    if (stack[j].tagName === tagName) {
                        foundIndex = j;
                        break;
                    }
                }
                if (foundIndex !== -1) {
                    stack.splice(foundIndex);
                }
            } else {
                const attrs = extractAttributes(tag.content);
                const isAriaHidden = attrs['aria-hidden'] === 'true';

                // Check if it's focusable and inside aria-hidden="true"
                let insideAriaHidden = isAriaHidden || stack.some(s => s.isAriaHidden);

                const isFocusable = focusableTags.has(tagName) || (tagName === 'a' && attrs.hasOwnProperty('href'));

                if (isFocusable && insideAriaHidden) {
                    const key = `${file}:${tagName}`;
                    if (!allowlist.includes(key)) {
                        console.error(`Focusable element <${tagName}> found inside aria-hidden="true" in ${file}`);
                        hasErrors = true;
                    }
                }

                const isSelfClosing = tag.content.endsWith('/>') || voidElements.has(tagName);
                if (!isSelfClosing) {
                    stack.push({ tagName, isAriaHidden });
                }
            }
        }
    }

    assert.strictEqual(hasErrors, false, 'Found focusable elements inside aria-hidden="true" without being in the allowlist');
});
