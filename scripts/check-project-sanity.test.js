const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('Project sanity check', () => {
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  const lockPath = path.resolve(process.cwd(), 'package-lock.json');

  assert.ok(fs.existsSync(pkgPath), 'package.json should exist');

  const pkgContent = fs.readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(pkgContent);

  assert.ok(pkg.scripts, 'package.json should have scripts block');
  assert.ok(pkg.scripts.test, 'package.json should have a test script');
  assert.ok(fs.existsSync(lockPath), 'package-lock.json should exist');
});
