const fs = require('fs');

let content = fs.readFileSync('tests/check-table-caption.test.js', 'utf8');
content = content.replace("if (tags[j].tagName === 'caption' && depth > 0) {", "if (tags[j].tagName === 'caption' && depth === 1) {");
fs.writeFileSync('tests/check-table-caption.test.js', content);
