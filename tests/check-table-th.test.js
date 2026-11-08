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

test('Check that <table> elements contain at least one <th>', () => {
    const htmlFiles = findHtmlFiles('.');
    let missingThWarnings = [];

    for (let file of htmlFiles) {
        const html = fs.readFileSync(file, 'utf8');
        const tags = parseHtml(html);

        for (let i = 0; i < tags.length; i++) {
            const tag = tags[i];
            if (tag.tagName === 'table') {
                 let hasTh = false;
                 let depth = 1;
                 for (let j = i + 1; j < tags.length; j++) {
                     if (tags[j].tagName === 'table') depth++;
                     else if (tags[j].tagName === '/table') depth--;

                     if (depth === 0) break;

                     if (tags[j].tagName === 'th') {
                         hasTh = true;
                         break;
                     }
                 }

                 if (!hasTh) {
                     missingThWarnings.push(`Warning: <table> element in ${file} at index ${tag.start} contains no <th> cells.`);
                 }
            }
        }
    }

    if (missingThWarnings.length > 0) {
        console.warn("The following <table> elements contain no <th> cells:");
        missingThWarnings.forEach(warning => console.warn(warning));
    }

    // We intentionally don't assert / fail here as per the requirement "logged in a warning list (i.e. not failing the test, just reporting)"
});
