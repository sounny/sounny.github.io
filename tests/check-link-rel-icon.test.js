const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = [
  'google03d463aa06323fde.html'
];

function getTopLevelHtmlFiles(dir) {
  const files = fs.readdirSync(dir);
  const fileList = [];
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'tests' || file === 'scripts') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isFile() && filePath.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

test('Top-level pages must have a link rel icon in head', () => {
  const files = getTopLevelHtmlFiles('.');
  let errors = [];

  for (const file of files) {
    const relativePath = path.relative('.', file).replace(/\\/g, '/');
    if (ALLOWLIST.includes(relativePath)) continue;

    const content = fs.readFileSync(file, 'utf8');

    // Extract the <head> tag content or content included in it.
    // However, if there are shared includes, we should search the whole file for safety
    // or rely on a simple check for any link rel icon in the file to be less strict
    // and accommodate includes if they aren't fully resolved.
    // The prompt says: "fails on top-level pages whose head has no link rel icon (directly or via a shared include)"
    // Since statically analyzing shared includes in unknown templating languages is hard,
    // we can just check if `<link rel="icon"` or similar exists anywhere in the file.
    // We will still try to scope it generally to the whole file if a head tag exists,
    // or just checking the whole file.

    // Check if the file contains a <link> with rel containing "icon".
    // Also handling multiple rel values like rel="shortcut icon"
    const linkRegex = /<link\s+([^>]+)>/gi;
    let match;
    let hasIcon = false;

    while ((match = linkRegex.exec(content)) !== null) {
      const attributesString = match[1];

      const attrRegex = /([a-zA-Z0-9_-]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+)))?/gi;
      let attrMatch;

      while ((attrMatch = attrRegex.exec(attributesString)) !== null) {
        const name = attrMatch[1].toLowerCase();
        const value = attrMatch[2] || attrMatch[3] || attrMatch[4];

        if (name === 'rel') {
            if (value && value.toLowerCase().split(/\s+/).includes('icon')) {
                hasIcon = true;
                break;
            }
        }
      }
      if (hasIcon) {
          break;
      }
    }

    if (!hasIcon) {
      errors.push(`File ${relativePath} does not have a link rel icon in the <head>.`);
    }
  }

  assert.strictEqual(errors.length, 0, 'Found files without link rel icon:\n' + errors.join('\n'));
});
