const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('assert');

const allowlist = [
  'google03d463aa06323fde.html'
];

function checkMetaCharsetInHead(content) {
  const headMatch = content.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (!headMatch) return false;

  const headContent = headMatch[1];
  const hasMetaCharset = /<meta[^>]+charset[^>]*>/i.test(headContent);
  return hasMetaCharset;
}

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        findHtmlFiles(path.join(dir, file), fileList);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (ext === '.html') {
        fileList.push(path.join(dir, file));
      }
    }
  }
  return fileList;
}

test('HTML files must have <meta charset> in <head>', () => {
  const filesToCheck = findHtmlFiles('.');
  let hasViolations = false;

  for (const file of filesToCheck) {
    const normalizedFile = file.startsWith('./') ? file.slice(2) : file;
    // Allowlist can use normalized path
    const isAllowlisted = allowlist.some(allowed => normalizedFile.endsWith(allowed));

    if (isAllowlisted) {
      continue;
    }

    const content = fs.readFileSync(file, 'utf8');
    const hasCharset = checkMetaCharsetInHead(content);

    if (!hasCharset) {
      console.error(`File ${file} is missing <meta charset> element in the <head>.`);
      hasViolations = true;
    }
  }

  assert.strictEqual(hasViolations, false, 'Found HTML files missing <meta charset> in <head>');
});
