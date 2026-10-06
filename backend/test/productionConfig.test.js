        for (const name of Object.keys(process.env)) delete process.env[name];
        Object.assign(process.env, original);
    });
}

test('valid generated production secrets and exact HTTPS origin are accepted', t => {
    configure(t);
    assert.doesNotThrow(validateEnv);
});
for (const name of ['JWT_SECRET', 'ENCRYPTION_KEY', 'QR_SIGNING_SECRET', 'ADMIN_PRIVATE_KEY', 'MONGODB_URI', 'REDIS_URL', 'ALLOWED_ORIGINS']) {
    test(`production rejects missing ${name}`, t => {
        configure(t, { [name]: '' });
        assert.throws(validateEnv, new RegExp(name));
    });
}
for (const value of ['your-jwt-secret-change-in-production', 'adminpassword', 'a'.repeat(64), 'short']) {
    test(`production rejects weak or placeholder secret (${value.length} characters)`, t => {
        configure(t, { JWT_SECRET: value });
        assert.throws(validateEnv, /JWT_SECRET/);
    });
}
test('production rejects reused signing and encryption secrets', t => {
    configure(t);
    process.env.ENCRYPTION_KEY = process.env.JWT_SECRET;
    assert.throws(validateEnv, /distinct/);
});
for (const origin of ['*', 'http://app.servicepass.org', 'https://localhost', 'https://127.0.0.1', 'https://app.servicepass.org/path', 'https://app.servicepass.org,', 'https://example.com']) {
    test(`production rejects unsafe CORS origin ${origin}`, t => {
        configure(t, { ALLOWED_ORIGINS: origin });
        assert.throws(validateEnv, /ALLOWED_ORIGINS/);
    });
}
for (const [name, value] of [
    ['MONGODB_URI', 'mongodb://db.servicepass.org/servicepass'],
    ['MONGODB_URI', 'mongodb+srv://app:adminpassword@db.servicepass.org/servicepass'],
    ['MONGODB_URI', 'mongodb+srv://app:VeryLongPassword123456789@db.servicepass.org/servicepass?tls=false'],
    ['REDIS_URL', 'redis://app:VeryLongPassword123456789@cache.servicepass.org:6379'],
    ['REDIS_URL', 'rediss://cache.servicepass.org:6380'],
    ['PACKAGE_ID', '0x...'], ['PORT', '0'], ['ADMIN_PRIVATE_KEY', crypto.randomBytes(32).toString('hex')],
]) {
    test(`production rejects invalid ${name}`, t => {
        configure(t, { [name]: value });
        assert.throws(validateEnv, new RegExp(name));
    });
}
test('CORS admits listed origins and rejects other browser origins', t => {
    configure(t, { ALLOWED_ORIGINS: 'https://app.servicepass.org, https://portal.servicepass.org' });
    const config = getCorsConfig();
    config.origin('https://portal.servicepass.org', (err, allowed) => { assert.equal(err, null); assert.equal(allowed, true); });
    config.origin('https://attacker.org', (err, allowed) => { assert(err); assert.equal(allowed, false); });
    config.origin(undefined, (err, allowed) => { assert.equal(err, null); assert.equal(allowed, true); });
});
test('file secrets load, preserve multiline values, and reject ambiguity or empty files', t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'servicepass-config-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const file = path.join(dir, 'secret');
    fs.writeFileSync(file, 'line1\nline2\n');
    const env = { FIREBASE_PRIVATE_KEY_FILE: file };
    loadSecrets(env);
    assert.equal(env.FIREBASE_PRIVATE_KEY, 'line1\nline2');
    assert.throws(() => loadSecrets({ JWT_SECRET: 'set', JWT_SECRET_FILE: file }), /not both/);
    fs.writeFileSync(file, '\n');
    assert.throws(() => loadSecrets({ JWT_SECRET_FILE: file }), /empty/);
    assert.throws(() => loadSecrets({ JWT_SECRET_FILE: path.join(dir, 'missing') }), /Unable to read JWT_SECRET_FILE/);
});
test('safe diagnostic environment hides URI credentials', t => {
    configure(t);
    const safe = getSafeEnvForLogging();
    for (const name of ['JWT_SECRET', 'ADMIN_PRIVATE_KEY', 'MONGODB_URI', 'REDIS_URL']) assert.equal(safe[name], '***REDACTED***');
});
test('actual server exits before application imports for insecure production configuration', t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'servicepass-startup-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    for (const changes of [{JWT_SECRET: ''}, {JWT_SECRET: 'your-jwt-secret-change-in-production'}, {ALLOWED_ORIGINS: '*'}]) {
        const env = {...process.env, ...validEnv(), ...changes};
        for (const name of Object.keys(env)) if (name.endsWith('_FILE') || name.startsWith('DOTENV_CONFIG_')) delete env[name];
        const result = spawnSync(process.execPath, [path.resolve(__dirname, '../src/server.js')], {cwd: dir, env, encoding: 'utf8', timeout: 10000});
        assert.equal(result.status, 1);
        assert.match(result.stderr, /Environment validation failed:/);
        assert(!result.stderr.includes(env.ADMIN_PRIVATE_KEY));
        assert(!result.stderr.includes('Cannot find module'));
    }
});
