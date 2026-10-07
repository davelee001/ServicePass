const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Exercise the real coverage config consumer across the scoped js-yaml major override.
test('Jest coverage loader reads YAML settings with js-yaml 4', async t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'servicepass-nyc-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    fs.writeFileSync(path.join(dir, 'package.json'), '{}');
    fs.writeFileSync(path.join(dir, '.nycrc.yaml'), 'all: true\ninclude:\n  - src/**/*.js\nexclude:\n  - src/__tests__/**\nreporter:\n  - text\n  - lcov\n');
    const loader = require('@istanbuljs/load-nyc-config');
    const config = await loader.loadNycConfig({ cwd: dir });
    assert.equal(config.all, true);
    assert.deepEqual(config.include, ['src/**/*.js']);
    assert.deepEqual(config.exclude, ['src/__tests__/**']);
    assert.deepEqual(config.reporter, ['text', 'lcov']);
});
