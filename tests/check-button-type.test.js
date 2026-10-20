const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const allowlist = [
  {
    file: "index.html",
    partialHtml: '<button class="nav-toggle" id="navToggle" aria-label="Toggle Navigation Menu" aria-expanded="false">'
  },
  {
    file: "index.html",
    partialHtml: '<button class="filter-btn active" data-filter="all" aria-label="All Apps (30)">'
  },
  {
    file: "index.html",
    partialHtml: '<button class="filter-btn" data-filter="gis" aria-label="GIS &amp; Mapping (9)">'
  },
  {
    file: "index.html",
    partialHtml: '<button class="filter-btn" data-filter="geoapps" aria-label="GeoApps (8)">'
  },
  {
    file: "index.html",
    partialHtml: '<button class="filter-btn" data-filter="design" aria-label="Design &amp; Media (3)">'
  },
  {
    file: "index.html",
    partialHtml: '<button class="filter-btn" data-filter="dev" aria-label="Web Dev &amp; AI (3)">'
  },
  {
    file: "index.html",
    partialHtml: '<button class="filter-btn" data-filter="productivity" aria-label="Productivity (7)">'
  }
];

function isAllowlisted(file, tagHtml) {
  return allowlist.some(item => file.endsWith(item.file) && tagHtml.includes(item.partialHtml));
}

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'scripts' || file === 'tests') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, fileList);
    } else if (filePath.match(/\.(html|css|js|svg)$/)) {
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

test('Button elements must have a type attribute', () => {
    const files = findFiles('.');
    const errors = [];

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const tags = parseHtml(content);

        for (const tag of tags) {
            if (tag.tagName === 'button') {
                const attrs = extractAttributes(tag.content);
                if (!attrs.hasOwnProperty('type')) {
                    if (!isAllowlisted(file, tag.content)) {
                        errors.push(`File: ${file} | Element: ${tag.content}`);
                    }
                }
            }
        }
    }

    assert.strictEqual(errors.length, 0, `Found <button> elements without a type attribute:\n${errors.join('\n')}`);
});
