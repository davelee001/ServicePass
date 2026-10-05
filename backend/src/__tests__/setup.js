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
}, 120000);

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
