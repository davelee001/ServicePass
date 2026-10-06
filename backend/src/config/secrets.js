const fs = require('node:fs');

const secretNames = [
    'JWT_SECRET', 'ENCRYPTION_KEY', 'QR_SIGNING_SECRET', 'ADMIN_PRIVATE_KEY',
    'MONGODB_URI', 'REDIS_URL', 'SMTP_PASS', 'TWILIO_AUTH_TOKEN', 'FIREBASE_PRIVATE_KEY',
];

function loadSecrets(env = process.env) {
    for (const name of secretNames) {
        const file = env[`${name}_FILE`];
        if (!file) continue;
        if (env[name]) throw new Error(`Configure either ${name} or ${name}_FILE, not both`);
        let value;
        try { value = fs.readFileSync(file, 'utf8').replace(/\r?\n$/, ''); }
        catch { throw new Error(`Unable to read ${name}_FILE`); }
        if (!value.trim()) throw new Error(`${name}_FILE is empty`);
        env[name] = value;
    }
}

module.exports = { loadSecrets };
