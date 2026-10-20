const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const allowlist = [];

function isAllowlisted(file, elHtml) {
  return allowlist.some(item => file.endsWith(item.file) && elHtml.includes(item.partialHtml));
}

function findRelevantFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findRelevantFiles(filePath, fileList);
    } else if (filePath.endsWith('.html') || filePath.endsWith('.css') || filePath.endsWith('.js') || filePath.endsWith('.svg')) {
      fileList.push(filePath);
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

        // Handle comments
        if (html.substring(start, start + 4) === '<!--') {
            let end = html.indexOf('-->', start);
            if (end === -1) break;
            i = end + 3;
            continue;
        }

        let end = html.indexOf('>', start);
        if (end === -1) break;

        // Make sure we're not inside a quote in an attribute
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
        const match = tagContent.match(/^(\/?[a-z0-9\-_:]+)/i);
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

test('Style elements should only be inside head', () => {
    const files = findRelevantFiles('.');
    let offenderCount = 0;

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const tags = parseHtml(content);
        let inHead = false;

        for (const tag of tags) {
            if (tag.tagName === 'head') inHead = true;
            if (tag.tagName === '/head') inHead = false;

            if (tag.tagName === 'style' && !inHead) {
                offenderCount++;
            }
        }
    }

    // Since there are currently 0 offenders, we strictly check for 0.
    // If there were offenders, we'd check if offenderCount <= MAX_ALLOWED.
    const MAX_ALLOWED = 0;

    assert.ok(offenderCount <= MAX_ALLOWED, `Found ${offenderCount} style elements outside of head, which exceeds the maximum allowed (${MAX_ALLOWED}).`);
});
