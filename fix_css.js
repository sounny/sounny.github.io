const fs = require('fs');

let css = fs.readFileSync('css/main.css', 'utf8');

css = css.replace(
  /\.btn-primary \{\n  background: var\(--primary\);\n  color: #fffaf2 !important;/g,
  '.btn-primary {\n  background: var(--primary);\n  color: #080200 !important;'
);

css = css.replace(
  /\.btn-primary:hover \{\n  color: #fffaf2 !important;/g,
  '.btn-primary:hover {\n  color: #080200 !important;'
);

css = css.replace(
  /\.filter-btn\.active \{\n  color: #fffaf2;\n\}/g,
  '.filter-btn.active {\n  color: #080200;\n}'
);

fs.writeFileSync('css/main.css', css);
console.log('CSS updated');
