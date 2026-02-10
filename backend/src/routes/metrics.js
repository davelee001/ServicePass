const express = require('express');
const router = express.Router();
const { register } = require('../utils/metrics');

router.get('/', async (req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (ex) {
        res.status(500).end(ex);
    }
});

module.exports = router;
