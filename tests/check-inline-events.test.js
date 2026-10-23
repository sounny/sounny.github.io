const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('assert');

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

        // Handle script tags carefully to skip over their content
        const scriptMatch = html.substring(start).match(/^<script[\s>]/i);
        if (scriptMatch) {
            let scriptEnd = html.substring(start).search(/<\/script>/i);
            if (scriptEnd !== -1) {
                // Also parse the opening <script> tag itself just in case someone puts an inline event on a script tag, though very unlikely.
                let scriptOpenTagEnd = html.indexOf('>', start);
                if (scriptOpenTagEnd !== -1) {
                   tags.push(html.substring(start, scriptOpenTagEnd + 1));
                }
                i = start + scriptEnd + 9;
                continue;
            }
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

        tags.push(html.substring(start, end + 1));
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

const CURRENT_INLINE_EVENT_COUNT = 0;

test('Count elements with inline on* event handlers', () => {
  const htmlFiles = findHtmlFiles('.');
  let elementsWithEventsCount = 0;

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const tags = parseHtml(html);

    for (const tag of tags) {
      if (tag.toLowerCase().startsWith('</')) {
          continue;
      }

      const attrs = extractAttributes(tag);
      let hasInlineEvent = false;

      for (const attrName of Object.keys(attrs)) {
         if (attrName.startsWith('on') && attrName.length > 2) {
            hasInlineEvent = true;
            break;
         }
      }

      if (hasInlineEvent) {
          elementsWithEventsCount++;
      }
    }
  }

  assert.ok(elementsWithEventsCount <= CURRENT_INLINE_EVENT_COUNT, `Found ${elementsWithEventsCount} elements with inline on* event handlers, which is greater than the allowed count of ${CURRENT_INLINE_EVENT_COUNT}.`);
});
