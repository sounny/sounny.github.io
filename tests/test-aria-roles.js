const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// WAI-ARIA 1.2 roles
const validRoles = new Set([
  "alert", "alertdialog", "application", "article", "banner", "button", "cell",
  "checkbox", "columnheader", "combobox", "complementary", "contentinfo",
  "definition", "dialog", "directory", "document", "feed", "figure", "form",
  "grid", "gridcell", "group", "heading", "img", "link", "list", "listbox",
  "listitem", "log", "main", "marquee", "math", "menu", "menubar", "menuitem",
  "menuitemcheckbox", "menuitemradio", "meter", "navigation", "none", "note",
  "option", "presentation", "progressbar", "radio", "radiogroup", "region",
  "row", "rowgroup", "rowheader", "scrollbar", "search", "searchbox", "separator",
  "slider", "spinbutton", "status", "switch", "tab", "table", "tablist", "tabpanel",
  "term", "textbox", "timer", "toolbar", "tooltip", "tree", "treegrid", "treeitem",
  // Additional from 1.2/1.3 draft and DPub
  "associationlist", "associationlistitemkey", "associationlistitemvalue",
  "blockquote", "caption", "code", "comment", "deletion", "emphasis", "generic",
  "insertion", "mark", "paragraph", "strong", "subscript", "superscript", "time",
  // DPub roles
  "doc-abstract", "doc-acknowledgments", "doc-afterword", "doc-appendix", "doc-backlink",
  "doc-biblioentry", "doc-bibliography", "doc-biblioref", "doc-chapter", "doc-colophon",
  "doc-conclusion", "doc-cover", "doc-credit", "doc-credits", "doc-dedication",
  "doc-endnote", "doc-endnotes", "doc-epigraph", "doc-epilogue", "doc-errata",
  "doc-example", "doc-footnote", "doc-foreword", "doc-glossary", "doc-glossref",
  "doc-index", "doc-introduction", "doc-noteref", "doc-notice", "doc-pagebreak",
  "doc-pagelist", "doc-part", "doc-preface", "doc-prologue", "doc-pullquote",
  "doc-qna", "doc-subtitle", "doc-tip", "doc-toc"
]);

// Allowlist for current offenders
// Format: "filepath:role"
const allowlist = new Set([
]);

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        findHtmlFiles(filePath, fileList);
      }
    } else if (filePath.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

test('Valid WAI-ARIA roles', () => {
  const htmlFiles = findHtmlFiles('.');
  let hasErrors = false;

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    // Match role="..." or role='...'
    const roleRegex = /role=(["'])(.*?)\1/g;
    let match;

    while ((match = roleRegex.exec(content)) !== null) {
      const roleStr = match[2];
      // role attributes can contain multiple space-separated roles
      const roles = roleStr.split(/\s+/).filter(r => r.length > 0);

      for (const role of roles) {
        const allowedKey = `${file}:${role}`;
        if (!validRoles.has(role) && !allowlist.has(allowedKey)) {
          console.error(`Invalid ARIA role "${role}" found in ${file}`);
          hasErrors = true;
        }
      }
    }
  }

  assert.strictEqual(hasErrors, false, 'Invalid ARIA roles found.');
});
