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
