const Transport = require('winston-transport');

// Send JSON logs through Elasticsearch's document API without the legacy APM dependency.
class ElasticsearchTransport extends Transport {
    constructor({ url, ...options }) { super(options); this.endpoint = new URL('servicepass-logs/_doc', url.endsWith('/') ? url : url + '/'); }
    log(info, callback) {
        setImmediate(() => this.emit('logged', info));
        const endpoint = new URL(this.endpoint);
        const headers = { 'Content-Type': 'application/json' };
        if (endpoint.username || endpoint.password) {
            headers.Authorization = 'Basic ' + Buffer.from(`${decodeURIComponent(endpoint.username)}:${decodeURIComponent(endpoint.password)}`).toString('base64');
            endpoint.username = ''; endpoint.password = '';
        }
        fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(info), signal: AbortSignal.timeout(5000) })
            .then(response => { if (!response.ok) throw new Error('Log indexing failed'); })
            .catch(() => console.error('Elasticsearch log delivery failed'))
            .finally(callback);
    }
}
module.exports = { ElasticsearchTransport };
