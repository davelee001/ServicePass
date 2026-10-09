const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'servicepass-move-'));
try {
    for (const file of ['Move.toml', 'Move.lock']) fs.copyFileSync(path.join(root, file), path.join(scratch, file));
    fs.cpSync(path.join(root, 'move', 'sources'), path.join(scratch, 'sources'), { recursive: true });
    for (const command of ['build', 'test']) {
        const result = spawnSync(process.env.SUI_BIN || 'sui', ['move', command, '--build-env', 'testnet', '--path', scratch], { stdio: 'inherit' });
        if (result.error) throw new Error(`Unable to run Sui CLI: ${result.error.message}. Install sui or set SUI_BIN to its executable path.`);
        if (result.status !== 0) { process.exitCode = result.status || 1; break; }
    }
} finally {
    fs.rmSync(scratch, { recursive: true, force: true });
}
