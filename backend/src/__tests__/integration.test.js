const request = require('supertest');
const app = require('../server');
require('./setup');

describe('Integration Tests for Batch Operations', () => {
    it('should handle bulk voucher minting and return success', async () => {
        const response = await request(app)
            .post('/bulk-mint')
            .send({
                vouchers: [
                    {
                        voucherType: 'discount',
                        amount: 10,
                        recipient: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                        merchantId: 'merchant-1',
                        expiryTimestamp: Date.now() + 100000,
                        metadata: 'Test metadata',
                    },
                ],
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