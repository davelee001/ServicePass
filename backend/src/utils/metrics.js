const client = require('prom-client');

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'service-pass-backend'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Create a histogram to track response times
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [50, 100, 200, 300, 400, 500, 750, 1000, 2000]
});

// Register the histogram
register.registerMetric(httpRequestDurationMicroseconds);

module.exports = {
    register,
    httpRequestDurationMicroseconds
};
