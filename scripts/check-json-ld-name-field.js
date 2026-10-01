const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../index.html');
let html;
try {
  html = fs.readFileSync(indexPath, 'utf-8');
} catch (e) {
  console.error('Failed to read index.html', e);
  process.exit(1);
}

const regex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
let match;
let foundSounny = false;

function checkObjectForSounnyName(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (typeof obj.name === 'string' && obj.name.includes('Sounny')) {
    return true;
  }
  if (obj['@graph'] && Array.isArray(obj['@graph'])) {
    for (const item of obj['@graph']) {
      if (checkObjectForSounnyName(item)) return true;
    }
  }
  return false;
}

while ((match = regex.exec(html)) !== null) {
  const jsonStr = match[1];
  try {
    const data = JSON.parse(jsonStr);

    if (Array.isArray(data)) {
      for (const item of data) {
        if (checkObjectForSounnyName(item)) {
          foundSounny = true;
          break;
        }
      }
    } else {
      if (checkObjectForSounnyName(data)) {
        foundSounny = true;
      }
    }

    if (foundSounny) break;
  } catch (e) {
    // ignore parse errors and try next block
  }
}

if (!foundSounny) {
  console.error('Error: index.html does not contain an application/ld+json block with a "name" field containing "Sounny"');
  process.exit(1);
}

console.log('Passed: Found application/ld+json block with "name" containing "Sounny".');
process.exit(0);
