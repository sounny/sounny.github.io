const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const EXCLUDED_DIRS = new Set(['node_modules', '.git']);
const TARGET_EXTENSIONS = new Set(['.html', '.js', '.css']);

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!EXCLUDED_DIRS.has(file)) {
        getAllFiles(filePath, fileList);
      }
    } else {
      const ext = path.extname(file);
      if (TARGET_EXTENSIONS.has(ext)) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

// Map of filepath -> array of SVG source strings that are allowed to fail the check
const ALLOWLIST = {
  // Add allowlisted svgs here if needed
  // No current offenders in the codebase
};

test('Inline <svg> elements should have accessibility attributes', () => {
  const rootDir = process.cwd();
  const files = getAllFiles(rootDir);
  const errors = [];

  for (const file of files) {
    const relPath = path.relative(rootDir, file);
    const content = fs.readFileSync(file, 'utf8');

    // Simple regex to extract <svg> tags and their inner content
    // This is not a perfect HTML parser, but should catch most inline svgs.
    const svgRegex = /<svg([^>]*?)>([\s\S]*?)<\/svg>|<svg([^>]*?)\/>/gi;
    let match;

    while ((match = svgRegex.exec(content)) !== null) {
      const svgTag = match[0];
      const attributes = (match[1] || match[3] || '');
      const innerContent = match[2] || '';

      const hasTitle = /<title[\s>]/i.test(innerContent);
      const hasAriaLabel = /\baria-label\s*=/i.test(attributes);
      const hasAriaLabelledby = /\baria-labelledby\s*=/i.test(attributes);
      const hasAriaHiddenTrue = /\baria-hidden\s*=\s*(["']?)true\1/i.test(attributes);

      if (!hasTitle && !hasAriaLabel && !hasAriaLabelledby && !hasAriaHiddenTrue) {
        const isAllowlisted = ALLOWLIST[relPath] && ALLOWLIST[relPath].some(allowedSvg => svgTag.includes(allowedSvg) || allowedSvg.includes(svgTag));
        if (!isAllowlisted) {
           errors.push(`File: ${relPath}\nSVG missing accessibility attributes: ${svgTag.substring(0, 100)}...`);
        }
      }
    }
  }

  assert.strictEqual(errors.length, 0, `Found ${errors.length} SVG elements missing accessibility attributes:\n\n${errors.join('\n\n')}`);
});
