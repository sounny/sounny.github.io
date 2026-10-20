const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('assert');

// Files to allowlist for current inline SVG accessibility offenders.
// Maps file path to the number of allowed offenders.
const allowlist = {};

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        findFiles(path.join(dir, file), fileList);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      // Look for html, css, js files where SVG could be embedded
      if (['.html', '.css', '.js'].includes(ext)) {
        fileList.push(path.join(dir, file));
      }
    }
  }
  return fileList;
}

test('Inline SVGs should have a <title>, aria-label, aria-hidden="true" or role="presentation"', () => {
  const filesToCheck = findFiles('.');
  let hasViolations = false;
  const currentOffenders = {};
  let totalOffenders = 0;
  let allowedOffendersTotal = 0;

  for (const count of Object.values(allowlist)) {
      allowedOffendersTotal += count;
  }

  for (const file of filesToCheck) {
    if (file === 'tests/check-svg-accessibility.test.js') continue;

    const content = fs.readFileSync(file, 'utf8');
    const svgRegex = /<svg\b[^>]*>([\s\S]*?)<\/svg>/gi;
    let match;
    let fileOffenders = 0;

    while ((match = svgRegex.exec(content)) !== null) {
      const fullSvg = match[0];
      const openingTag = fullSvg.substring(0, fullSvg.indexOf('>') + 1);
      const innerContent = match[1];

      const hasAriaLabel = /aria-label\s*=/i.test(openingTag);
      const hasAriaHidden = /aria-hidden(?:\s*=|\s*>|\s+)/i.test(openingTag);
      const hasRolePresentation = /role\s*=\s*['"]presentation['"]/i.test(openingTag);
      const hasTitle = /<title\b[^>]*>[\s\S]*?<\/title>/i.test(innerContent);

      if (!hasAriaLabel && !hasAriaHidden && !hasRolePresentation && !hasTitle) {
        fileOffenders++;
        totalOffenders++;
      }
    }

    if (fileOffenders > 0) {
      currentOffenders[file] = fileOffenders;
    }
  }

  if (totalOffenders > allowedOffendersTotal) {
      console.error(`Found ${totalOffenders} inline SVGs with accessibility issues, which is more than the allowed ${allowedOffendersTotal}.`);
      console.error("Current offenders:");
      for(const [file, count] of Object.entries(currentOffenders)) {
          console.error(`  - ${file}: ${count}`);
      }
      hasViolations = true;
  }

  assert.strictEqual(hasViolations, false, 'Number of inline SVGs with accessibility issues exceeded allowlist count');
});
