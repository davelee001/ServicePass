// Isolated test-only configuration; production validation remains enabled.
Object.assign(process.env, {
    NODE_ENV: 'test', PORT: '3000', MONGODB_URI: 'mongodb://127.0.0.1:27017/servicepass-test',
    JWT_SECRET: 'test-secret', QR_SIGNING_SECRET: 'test-qr-secret',
    ADMIN_PRIVATE_KEY: Buffer.alloc(32, 1).toString('base64'),
    PACKAGE_ID: '0x1', ADMIN_CAP_ID: '0x2', REGISTRY_ID: '0x3', SUI_NETWORK: 'testnet',
});
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    // Suites that reconnect must use the same isolated test database.
    process.env.MONGODB_URI = mongoUri;
    await mongoose.connect(mongoUri);
    await Promise.all(Object.values(mongoose.models).map(model => model.createIndexes()));
}, 120000);

beforeEach(() => { jest.clearAllMocks(); });

// Cleanup after each test
afterEach(async () => {
    if (mongoose.connection.readyState !== 1) return;
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

// Teardown after all tests
afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
});

module.exports = {
    clearDB: async () => {
        for (const collection of Object.values(mongoose.connection.collections)) await collection.deleteMany({});
    },
};
