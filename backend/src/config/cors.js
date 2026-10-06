    const production = process.env.NODE_ENV === 'production';
    const allowedOrigins = production
        ? getProductionOrigins(process.env.ALLOWED_ORIGINS)
        : (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3001').split(',').map(value => value.trim());
    return {
        origin(origin, callback) {
            // CORS restricts browser origins; API authentication also applies to clients without Origin.
            if (!origin || !production || allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error('Origin is not allowed by CORS'), false);
        },
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
        exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
        maxAge: 86400,
    };
}

module.exports = { getCorsConfig };
