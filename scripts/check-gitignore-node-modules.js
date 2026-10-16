const fs = require('fs');
const path = require('path');

const gitignorePath = path.join(__dirname, '..', '.gitignore');

try {
  const content = fs.readFileSync(gitignorePath, 'utf8');
  const lines = content.split('\n').map(line => line.trim());

  if (lines.includes('node_modules') || lines.includes('node_modules/')) {
    console.log('✅ .gitignore lists node_modules');
    process.exit(0);
  } else {
    console.error('❌ .gitignore does not list node_modules');
    process.exit(1);
  }
} catch (err) {
  if (err.code === 'ENOENT') {
    console.error('❌ .gitignore file not found');
    process.exit(1);
  } else {
    console.error(`❌ Error reading .gitignore: ${err.message}`);
    process.exit(1);
  }
}
