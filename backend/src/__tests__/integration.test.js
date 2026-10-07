const request = require('supertest');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Merchant = require('../models/Merchant');
jest.mock('../config/sui', () => ({
    suiClient: { signAndExecuteTransaction: jest.fn(), multiGetObjects: jest.fn() },
    getAdminKeypair: jest.fn(() => ({})), PACKAGE_ID: '0x1', ADMIN_CAP_ID: '0x2', REGISTRY_ID: '0x3',
}));
const { suiClient } = require('../config/sui');
const app = require('../server');
const owner = '0x' + 'a'.repeat(64);
const merchantObjectId = '0x' + 'b'.repeat(64);
let token;
beforeEach(async () => {
    const admin = await User.create({ email: 'admin@test.com', password: 'test-password-123', name: 'Admin', role: 'admin' });
    token = jwt.sign({ userId: admin._id, role: 'admin' }, process.env.JWT_SECRET);
    suiClient.signAndExecuteTransaction.mockImplementation(async ({ transaction }) => {
        const call = transaction.getData().commands[0].MoveCall;
        const merchant = call.function === 'register_merchant';
        expect(call.arguments).toHaveLength(merchant ? 4 : 9);
        return { digest: 'test-digest', effects: { status: { status: 'success' } }, objectChanges: [{
            type: 'created', objectType: `0x1::voucher_system::${merchant ? 'Merchant' : 'Voucher'}`,
            objectId: merchant ? merchantObjectId : owner,
        }] };
    });
    suiClient.multiGetObjects.mockResolvedValue([{ data: { objectId: merchantObjectId, content: { fields: { merchant_id: 'clinic' } } } }]);
});
describe('Authenticated batch integration through the actual app', () => {
    test('bulk mint reaches the modern SDK with nine typed arguments', async () => {
        const response = await request(app).post('/api/vouchers/bulk-mint').set('Authorization', `Bearer ${token}`).send({
            vouchers: [{ voucherType: 2, amount: 100, recipient: owner, merchantId: 'clinic', expiryTimestamp: Date.now() + 86400000 }],
        });
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Bulk vouchers minted successfully');
    });

    it('should handle CSV import for recipients and return success', async () => {
        const response = await request(app)
            .post('/import-recipients')
            .attach('file', '__tests__/test-files/recipients.csv');

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Recipients imported and vouchers created successfully');
    });

    it('should handle batch merchant registration and return success', async () => {
        const response = await request(app)
            .post('/batch-register')
            .send({
                merchants: [
                    {
                        merchantId: 'merchant-2',
                        name: 'Test Merchant',
                        walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
                        voucherTypesAccepted: ['discount'],
                        contactEmail: 'test@merchant.com',
                    },
                ],
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Batch merchants registered successfully');
    });
});