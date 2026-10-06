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
