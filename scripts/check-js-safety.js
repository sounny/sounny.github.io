const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, '..', 'js', 'main.js');

try {
  const content = fs.readFileSync(mainJsPath, 'utf8');
  let warnings = [];

  if (content.includes('eval(')) {
    warnings.push('eval(');
  }
  if (content.includes('new Function(')) {
    warnings.push('new Function(');
  }
  if (content.includes('document.write(')) {
    warnings.push('document.write(');
  }

  if (warnings.length > 0) {
    console.warn(`Warning: js/main.js uses potentially unsafe functions: ${warnings.join(', ')}`);
  } else {
    console.log('js/main.js passed safety checks.');
  }
} catch (err) {
  if (err.code === 'ENOENT') {
    console.warn('Warning: js/main.js not found, skipping safety check.');
  } else {
    console.error('Error reading js/main.js:', err);
    process.exit(1);
  }
}
