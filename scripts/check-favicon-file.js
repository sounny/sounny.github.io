const fs = require('fs');

if (!fs.existsSync('favicon.png')) {
  console.error('favicon.png does not exist');
  process.exit(1);
}
console.log('favicon.png exists');
