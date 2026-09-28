const fs = require('fs');
const path = require('path');

const filesToCheck = ['index.html', 'privacy.html'];
let hasErrors = false;

// Helper to extract IDs from an HTML string
function getIds(html) {
  const ids = new Set();
  const regex = /id=["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    ids.add(match[1]);
  }
  return ids;
}

// Helper to extract hrefs from an HTML string
function getHrefs(html) {
  const hrefs = [];
  const regex = /href=["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    hrefs.push(match[1]);
  }
  return hrefs;
}

// Cache for file contents and IDs to avoid re-reading
const fileCache = new Map();
const idCache = new Map();

function getFileContent(filePath) {
  if (fileCache.has(filePath)) {
    return fileCache.get(filePath);
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    fileCache.set(filePath, content);
    idCache.set(filePath, getIds(content));
    return content;
  } catch (err) {
    return null;
  }
}

function getFileIds(filePath) {
  if (!idCache.has(filePath)) {
    getFileContent(filePath);
  }
  return idCache.get(filePath) || new Set();
}

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  const html = getFileContent(filePath);

  if (html === null) {
    console.error(`Error: Could not read file ${file}`);
    hasErrors = true;
    return;
  }

  const ids = getFileIds(filePath);
  const hrefs = getHrefs(html);

  hrefs.forEach(href => {
    // Ignore external and absolute URLs, mailto, tel
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('//')) {
      return;
    }

    // Handle internal hash links
    if (href.startsWith('#')) {
      const id = href.substring(1);
      // Let's not fail on empty href="#" as it's often used for JS actions or top of page
      if (id === '') return;

      if (!ids.has(id)) {
        console.error(`Broken internal link in ${file}: "${href}" (id="${id}" not found)`);
        hasErrors = true;
      }
      return;
    }

    // Handle local file paths
    let targetPathStr = href;
    let targetHash = null;

    const hashIndex = href.indexOf('#');
    if (hashIndex !== -1) {
      targetPathStr = href.substring(0, hashIndex);
      targetHash = href.substring(hashIndex + 1);
    }

    // Remove query params if any
    const queryIndex = targetPathStr.indexOf('?');
    if (queryIndex !== -1) {
      targetPathStr = targetPathStr.substring(0, queryIndex);
    }

    if (targetPathStr) {
      const targetFilePath = path.join(__dirname, targetPathStr);

      if (!fs.existsSync(targetFilePath)) {
        console.error(`Broken local file link in ${file}: "${href}" (file ${targetPathStr} not found)`);
        hasErrors = true;
        return;
      }

      // Check hash in the target file
      if (targetHash && targetHash !== '') {
        const targetIds = getFileIds(targetFilePath);
        if (!targetIds.has(targetHash)) {
          console.error(`Broken hash link in ${file}: "${href}" (id="${targetHash}" not found in ${targetPathStr})`);
          hasErrors = true;
        }
      }
    }
  });
});

if (hasErrors) {
  console.error('\nLink check failed: Broken links found.');
  process.exit(1);
} else {
  console.log('Link check passed: All local links are valid.');
}
