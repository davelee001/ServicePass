const { SuiClient, getFullnodeUrl } = require('@mysten/sui.js/client');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');

// Initialize SUI client
const suiClient = new SuiClient({ 
    url: getFullnodeUrl(process.env.SUI_NETWORK || 'testnet') 
});

// Admin keypair (load from environment variable)
const getAdminKeypair = () => {
    const privateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('ADMIN_PRIVATE_KEY not found in environment variables');
    }
    return Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
};

module.exports = {
    suiClient,
    getAdminKeypair,
    PACKAGE_ID: process.env.PACKAGE_ID || '',
    ADMIN_CAP_ID: process.env.ADMIN_CAP_ID || '',
    REGISTRY_ID: process.env.REGISTRY_ID || '',
};
