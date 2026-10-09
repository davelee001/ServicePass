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


// gaxios 6 consumes only UUID v4 for multipart boundaries; verify its real request path.
test('Google request multipart serialization remains compatible with scoped UUID 11', async () => {
    const { Gaxios } = require('gaxios');
    let body;
    const client = new Gaxios();
    await client.request({
        url: 'https://upload.invalid/test', method: 'POST',
        multipart: [{ headers: { 'Content-Type': 'text/plain' }, content: 'multipart payload' }],
        adapter: async options => {
            const chunks = [];
            for await (const chunk of options.body) chunks.push(Buffer.from(chunk));
            body = Buffer.concat(chunks).toString();
            assert.match(options.headers['Content-Type'], /boundary=[0-9a-f-]{36}$/);
            return { data: 'ok', status: 200, statusText: 'OK', headers: {}, config: options };
        },
    });
    assert.match(body, /multipart payload/);
});

test('Elasticsearch JSON transport sends structured logs and basic authentication', async t => {
    const http = require('node:http');
    const { ElasticsearchTransport } = require('../src/utils/elasticsearchTransport');
    let received;
    const server = http.createServer(async (req, res) => {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        received = { url: req.url, auth: req.headers.authorization, body: JSON.parse(Buffer.concat(chunks)) };
        res.writeHead(201); res.end('{}');
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const transport = new ElasticsearchTransport({ url: `http://log-user:log-password@127.0.0.1:${server.address().port}` });
    await new Promise(resolve => transport.log({ level: 'info', message: 'Test event', timestamp: '2026-10-07' }, resolve));
    assert.equal(received.url, '/servicepass-logs/_doc');
    assert.equal(received.auth, 'Basic ' + Buffer.from('log-user:log-password').toString('base64'));
    assert.equal(received.body.message, 'Test event');
});
