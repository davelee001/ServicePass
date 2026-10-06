// Load and validate configuration before modules capture credentials or start services.
require('dotenv').config();
try {
    require('./secrets').loadSecrets();
    require('./envValidation').validateEnv();
} catch (error) {
    console.error(`Environment validation failed: ${error.message}`);
    process.exit(1);
}
