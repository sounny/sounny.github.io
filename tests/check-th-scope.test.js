const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else {
        const ext = path.extname(file).toLowerCase();
        if (['.html'].includes(ext)) {
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

const CURRENT_COUNT = 0;

test('Check that <th> elements have a scope attribute', () => {
    const htmlFiles = findHtmlFiles('.');
    let missingScopeCount = 0;

    for (let file of htmlFiles) {
        const html = fs.readFileSync(file, 'utf8');
        const tags = parseHtml(html);

        for (const tag of tags) {
            if (tag.tagName === 'th') {
                 const attrs = extractAttributes(tag.content);
                 if (!('scope' in attrs)) {
                     missingScopeCount++;
                 }
            }
        }
    }

    assert.ok(
        missingScopeCount <= CURRENT_COUNT,
        `Found ${missingScopeCount} <th> elements missing a 'scope' attribute. Allowed limit is ${CURRENT_COUNT}. Please add scope="col" or scope="row" to your <th> elements.`
    );
});
