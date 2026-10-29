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
        if (['.html'].includes(ext)) {
          fileList.push(filePath);
        }
    }
  }
  return fileList;
}

const CURRENT_DETAILS_WITHOUT_SUMMARY_COUNT = 0;

test('Every details element has a summary as its first child', () => {
    const htmlFiles = findHtmlFiles('.');
    let totalDetailsWithoutSummary = 0;

    for (const file of htmlFiles) {
        const html = fs.readFileSync(file, 'utf8');
        let index = 0;

        while (true) {
            index = html.toLowerCase().indexOf('<details', index);
            if (index === -1) break;

            // Find the end of the opening tag
            let tagEnd = html.indexOf('>', index);
            if (tagEnd === -1) break;

            // Check if it's actually the <details> tag and not a different tag starting with "details"
            const tagChar = html.charAt(index + 8);
            if (tagChar !== ' ' && tagChar !== '>' && tagChar !== '\n' && tagChar !== '\r' && tagChar !== '\t') {
                index = index + 8;
                continue;
            }

            // Find innerHTML start
            const innerStart = tagEnd + 1;

            // Need to handle nested details correctly
            let openTags = 1;
            let currentIdx = innerStart;

            while (openTags > 0 && currentIdx < html.length) {
                let nextOpen = html.toLowerCase().indexOf('<details', currentIdx);
                let nextClose = html.toLowerCase().indexOf('</details>', currentIdx);

                // Validate nextOpen to ensure it's not a different tag
                if (nextOpen !== -1) {
                   const charAfterOpen = html.charAt(nextOpen + 8);
                   if (charAfterOpen !== ' ' && charAfterOpen !== '>' && charAfterOpen !== '\n' && charAfterOpen !== '\r' && charAfterOpen !== '\t') {
                       // Skip this false positive
                       currentIdx = nextOpen + 8;
                       continue;
                   }
                }

                if (nextClose === -1) break; // Malformed HTML

                if (nextOpen !== -1 && nextOpen < nextClose) {
                    openTags++;
                    currentIdx = html.indexOf('>', nextOpen) + 1;
                } else {
                    openTags--;
                    currentIdx = nextClose + 10; // move past </details>
                }
            }

            if (openTags === 0) {
                // Found the matching closing tag
                const innerHTML = html.substring(innerStart, currentIdx - 10);

                // Remove comments and leading whitespace
                const cleanHTML = innerHTML.replace(/<!--[\s\S]*?-->/g, '').trim();

                if (!cleanHTML.toLowerCase().startsWith('<summary')) {
                    totalDetailsWithoutSummary++;
                    console.log(`details element without summary as first child found in ${file}`);
                }
            }

            index = innerStart;
        }
    }

    assert.ok(
        totalDetailsWithoutSummary <= CURRENT_DETAILS_WITHOUT_SUMMARY_COUNT,
        `Found ${totalDetailsWithoutSummary} details elements without summary as first child, which exceeds the allowed count of ${CURRENT_DETAILS_WITHOUT_SUMMARY_COUNT}.`
    );
});
