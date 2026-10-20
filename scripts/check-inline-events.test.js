const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert');

// Allowlist map: filename -> array of matching strings (the actual inline event definitions)
// Example structure: { 'index.html': ['onclick='] }
const ALLOWLIST = {
}; // No offenders initially

function findInlineEvents(content) {
  const events = [];
  // Basic regex to match HTML tags and their attributes.
  // It matches anything between < and >.
  const tagRegex = /<([a-z0-9\-]+)([^>]*)>/ig;
  let tagMatch;
  while ((tagMatch = tagRegex.exec(content)) !== null) {
    const tagName = tagMatch[1].toLowerCase();
    const attributes = tagMatch[2];

    // Find all attributes in the tag that start with 'on' followed by word characters and '='
    // ensure there's a space or it's the start of the string to avoid things like data-online=
    const attrRegex = /(?:\s|^)(on[a-z]+)\s*=/ig;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attributes)) !== null) {
      events.push(attrMatch[0].trim()); // store the actual match, trimmed
    }
  }
  return events;
}

function checkInlineEventsInDir(dir) {
  let unexpectedEvents = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        unexpectedEvents = unexpectedEvents.concat(checkInlineEventsInDir(fullPath));
      }
    } else if (file.endsWith('.html') || file.endsWith('.svg')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const events = findInlineEvents(content);

      const normalizedPath = fullPath.split(path.sep).join('/');

      const allowedForFile = ALLOWLIST[normalizedPath] || [];
      const currentAllowed = [...allowedForFile];

      for (const ev of events) {
        const allowedIndex = currentAllowed.indexOf(ev);
        if (allowedIndex !== -1) {
          currentAllowed.splice(allowedIndex, 1);
        } else {
           unexpectedEvents.push(`${normalizedPath}: ${ev}`);
        }
      }
    }
  }
  return unexpectedEvents;
}

test('no new inline event handlers', () => {
  const unexpectedEvents = checkInlineEventsInDir('.');
  assert.ok(unexpectedEvents.length === 0, `Found unexpected inline event handlers:\n${unexpectedEvents.join('\n')}`);
});
