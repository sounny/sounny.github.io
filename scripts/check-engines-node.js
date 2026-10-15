const fs = require('fs');
const semver = require('semver');

const pkgPath = 'package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

if (!pkg.engines || pkg.engines.node === undefined) {
  console.log('check-engines-node.js: engines.node is missing in package.json (OK).');
  process.exit(0);
}

const nodeEngine = pkg.engines.node;

if (typeof nodeEngine !== 'string' || nodeEngine.trim() === '') {
  console.error('check-engines-node.js: Error: package.json has an empty or invalid engines.node field.');
  process.exit(1);
}

const validRange = semver.validRange(nodeEngine);

if (!validRange) {
  console.error(`check-engines-node.js: Error: engines.node '${nodeEngine}' is not a valid semver range.`);
  process.exit(1);
}

console.log(`check-engines-node.js: engines.node '${nodeEngine}' is valid.`);
process.exit(0);
