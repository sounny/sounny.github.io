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

const allowlist = [];

test('label for attributes must reference existing IDs in the same file', () => {
    const htmlFiles = findHtmlFiles('.');
    let hasErrors = false;

    for (let file of htmlFiles) {
        const html = fs.readFileSync(file, 'utf8');
        const tags = parseHtml(html);
        const ids = new Set();

        // Normalize path for cross-platform keys in allowlist
        file = file.split(path.sep).join('/');

        // First pass: collect all IDs
        for (const tag of tags) {
             const attrs = extractAttributes(tag.content);
             if (attrs.id && attrs.id.trim() !== '') {
                 ids.add(attrs.id.trim());
             }
        }

        // Second pass: check label for attributes
        for (const tag of tags) {
            if (tag.tagName === 'label') {
                const attrs = extractAttributes(tag.content);
                const forAttr = attrs['for'];

                if (forAttr && forAttr.trim() !== '') {
                    const ref = forAttr.trim();
                    if (!ids.has(ref)) {
                         const key = `${file}:${ref}`;
                         if (!allowlist.includes(key)) {
                             console.error(`Missing ID "${ref}" referenced by label for attribute in ${file}`);
                             hasErrors = true;
                         }
                    }
                }
            }
        }
    }

    assert.strictEqual(hasErrors, false, 'Found label for referencing non-existent IDs');
});
