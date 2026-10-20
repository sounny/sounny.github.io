const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const agentsPath = path.join(rootDir, 'AGENTS.md');

if (!fs.existsSync(agentsPath)) {
  console.log('No AGENTS.md found. Skipping verification.');
  process.exit(0);
}

const content = fs.readFileSync(agentsPath, 'utf8');

// Parse potential paths from backticks
const backticks = [...content.matchAll(/`([^`]+)`/g)].map(m => m[1]);
const extensions = ['.html', '.css', '.js', '.md', '.json', '.png', '.jpg', '.yml', '.txt'];

const potentialPaths = new Set([...backticks]);

// Also parse potential paths from raw text, looking for extensions or slash paths
content.split(/\s+/).forEach(word => {
  // Strip common punctuation around words
  const clean = word.replace(/^[^\w./]+|[^\w./]+$/g, '');
  if (clean.includes('/') || extensions.some(ext => clean.endsWith(ext))) {
    if (!clean.startsWith('http') && !clean.includes('github.io')) {
      potentialPaths.add(clean);
    }
  }
});

let missing = 0;
for (const p of potentialPaths) {
  // Filter out backticked words that aren't actually file paths
  // Assume file paths either have a slash or a known extension
  if (!p.includes('/') && !extensions.some(ext => p.endsWith(ext))) {
    continue;
  }

  const fullPath = path.resolve(rootDir, p);
  if (!fullPath.startsWith(path.resolve(rootDir))) {
    continue;
  }

  if (!fs.existsSync(fullPath)) {
    console.warn(`WARNING: Path mentioned in AGENTS.md does not exist: ${p}`);
    missing++;
  }
}

if (missing === 0) {
  console.log('Verified paths in AGENTS.md. All mentioned paths exist.');
} else {
  console.log(`Verified paths in AGENTS.md. Found ${missing} missing path(s). (Warnings only, no failure)`);
}
