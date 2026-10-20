const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const allowlist = [];

function isAllowlisted(file, elHtml) {
  return allowlist.some(item => file.endsWith(item.file) && elHtml.includes(item.partialHtml));
}

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else if (filePath.endsWith('.html')) {
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
        const match = tagContent.match(/^(\/?[a-z0-9\-_]+)/i);
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
    const attrString = tagString.replace(/^<\/?\s*[a-z0-9\-_]+/i, '').replace(/\/?>$/, '').trim();
    const attrs = {};
    const regex = /([a-z0-9\-_]+)(?:\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|([^>\s]+)))?/gi;
    let match;
    while ((match = regex.exec(attrString)) !== null) {
        const name = match[1].toLowerCase();
        const value = match[2] !== undefined ? match[2] : (match[3] !== undefined ? match[3] : match[4]);
        attrs[name] = value === undefined ? '' : value;
    }
    return attrs;
}

test('Form inputs must have labels or aria labels', () => {
    const htmlFiles = findHtmlFiles('.');
    const errors = [];

    for (const file of htmlFiles) {
        const html = fs.readFileSync(file, 'utf8');
        const tags = parseHtml(html);
        let openLabels = [];
        const labelsFor = new Set();

        for (const tag of tags) {
            if (tag.tagName === 'label') {
                const attrs = extractAttributes(tag.content);
                if (attrs['for']) {
                    labelsFor.add(attrs['for']);
                }
            }
        }

        for (const tag of tags) {
            if (tag.tagName === 'label') openLabels.push(tag);
            if (tag.tagName === '/label') openLabels.pop();

            if (['input', 'select', 'textarea'].includes(tag.tagName)) {
                const attrs = extractAttributes(tag.content);

                if (tag.tagName === 'input') {
                    const type = (attrs.type || 'text').toLowerCase();
                    if (['hidden', 'submit', 'button', 'image', 'reset'].includes(type)) {
                        continue;
                    }
                }

                const hasAriaLabel = attrs['aria-label'] && attrs['aria-label'].trim() !== '';
                const hasAriaLabelledBy = attrs['aria-labelledby'] && attrs['aria-labelledby'].trim() !== '';
                const hasId = attrs['id'] && attrs['id'].trim() !== '';

                const hasEnclosingLabel = openLabels.length > 0;
                const hasExplicitLabel = hasId && labelsFor.has(attrs['id']);

                if (!hasAriaLabel && !hasAriaLabelledBy && !hasEnclosingLabel && !hasExplicitLabel) {
                    if (!isAllowlisted(file, tag.content)) {
                        errors.push(`File: ${file} | Element: ${tag.content}`);
                    }
                }
            }
        }
    }

    assert.strictEqual(errors.length, 0, `Found form elements without labels:\n${errors.join('\n')}`);
});
