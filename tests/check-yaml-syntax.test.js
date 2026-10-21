const test = require('node:test');
const assert = require('node:assert');
const { execSync } = require('child_process');

const ALLOWLIST = [
  // Files currently allowed to have invalid YAML
];

test('tracked .yml and .yaml files should have valid syntax', (t) => {
  let trackedFiles = [];
  try {
    const output = execSync('git ls-files', { encoding: 'utf8' });
    trackedFiles = output.split('\n').filter(f => f.trim().length > 0);
  } catch (err) {
    t.skip('Could not retrieve tracked files via git');
    return;
  }

  const yamlFiles = trackedFiles.filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));

  if (yamlFiles.length === 0) {
    t.skip('No tracked .yml or .yaml files found in the repository');
    return;
  }

  // Determine if yq or ruby is available
  let parserCommand = null;

  try {
    execSync('yq --version', { stdio: 'ignore' });
    // yq . <file> reads the file and validates YAML syntax
    parserCommand = (file) => `yq . "${file.replace(/"/g, '\\"')}"`;
  } catch (e1) {
    try {
      execSync('ruby -v', { stdio: 'ignore' });
      // use ruby to validate, safely escaping quotes
      parserCommand = (file) => `ruby -ryaml -e "YAML.load_file('${file.replace(/'/g, "\\'")}')"`;
    } catch (e2) {
      try {
        execSync('python3 -c "import yaml"', { stdio: 'ignore' });
        parserCommand = (file) => `python3 -c "import yaml; yaml.safe_load(open('${file.replace(/'/g, "\\'")}'))"`;
      } catch (e3) {
        t.skip('No suitable YAML parser (yq, ruby, or python3+yaml) found in environment');
        return;
      }
    }
  }

  for (const file of yamlFiles) {
    if (ALLOWLIST.includes(file)) {
      continue;
    }

    let isValid = true;
    let errorMessage = '';
    const cmd = parserCommand(file);
    try {
      execSync(cmd, { stdio: 'pipe', encoding: 'utf8' });
    } catch (e) {
      isValid = false;
      errorMessage = e.stderr || e.stdout || e.message;
    }

    assert.ok(isValid, `File ${file} has invalid YAML syntax:\n${errorMessage}`);
  }
});
