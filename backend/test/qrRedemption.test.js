const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const request = require('supertest');
const express = require('express');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { Transaction } = require('@mysten/sui/transactions');
const { normalizeSuiObjectId, SUI_CLOCK_OBJECT_ID } = require('@mysten/sui/utils');
const { createQrRedemptionService } = require('../src/services/qrRedemption');
const { createQrRouter } = require('../src/routes/qrRedemptions');
const id = n => normalizeSuiObjectId(`0x${n}`);
const packageId = id('1'), registryId = id('2'), merchantId = id('3'), voucherId = id('4');
const digest = '11111111111111111111111111111111';
const owner = new Ed25519Keypair();
const secret = crypto.randomBytes(32).toString('hex');

function fixture() {
    let time = Date.now();
    const intents = new Map(), redemptions = new Map(), submitted = [];
    const merchant = { merchantId: 'clinic', onChainObjectId: merchantId, isActive: true };
    const fields = { voucher_type: 2, amount: '100', merchant_id: 'clinic', expiry_timestamp: String(time + 86400000), is_redeemed: false };
    const clockFields = { timestamp_ms: String(time) };
    const objects = {
        [SUI_CLOCK_OBJECT_ID]: { objectId: SUI_CLOCK_OBJECT_ID, owner: { Shared: { initial_shared_version: '1' } }, content: { type: '0x2::clock::Clock', fields: clockFields } },
        [voucherId]: { objectId: voucherId, version: '1', digest, owner: { AddressOwner: owner.toSuiAddress() }, content: { type: `${packageId}::voucher_system::Voucher`, fields } },
        [merchantId]: { objectId: merchantId, version: '1', digest, owner: { Shared: { initial_shared_version: '1' } }, content: { type: `${packageId}::voucher_system::Merchant`, fields: { merchant_id: 'clinic', voucher_types_accepted: [2] } } },
        [registryId]: { objectId: registryId, version: '1', digest, owner: { Shared: { initial_shared_version: '1' } }, content: { type: `${packageId}::voucher_system::VoucherRegistry`, fields: {} } },
    };
    let recorded = 0, executions = 0, uncertain = false, effectsStatus = 'success', storageFailure = false, wrongEvent = false;
    const ledger = new Map();
    const client = {
        getObject: async ({ id }) => ({ data: objects[id] }),
        getReferenceGasPrice: async () => '1000',
        getCoins: async ({ owner: address }) => {
            assert.equal(address, owner.toSuiAddress());
            return { data: [{ coinObjectId: id('5'), version: '1', digest, balance: '100000000' }] };
        },
        getTransactionBlock: async ({ digest }) => {
            if (!ledger.has(digest)) throw new Error('Transaction not found');
            return ledger.get(digest);
        },
        executeTransactionBlock: async ({ transactionBlock }) => {
            executions++;
            const tx = Transaction.from(transactionBlock);
            const data = tx.getData();
            assert.equal(data.sender, owner.toSuiAddress());
            assert.equal(data.commands.length, 1);
            assert.equal(data.commands[0].MoveCall.function, 'redeem_voucher');
            assert.deepEqual(data.commands[0].MoveCall.arguments.map(arg => arg.Input), [0, 1, 2]);
            assert.equal(data.inputs[0].Object.SharedObject.objectId, registryId);
            assert.equal(data.inputs[1].Object.SharedObject.objectId, merchantId);
            assert.equal(data.inputs[2].Object.ImmOrOwnedObject.objectId, voucherId);
            submitted.push(transactionBlock);
            const result = { digest: await tx.getDigest(), effects: { status: { status: effectsStatus } }, events: [{
                type: `${packageId}::voucher_system::VoucherRedeemed`, parsedJson: { voucher_id: voucherId, merchant_id: wrongEvent ? 'other' : 'clinic', amount: '100', voucher_type: 2 },
            }] };
            ledger.set(result.digest, result);
            if (uncertain) throw new Error('timeout after execution');
            return result;
        },
    };
    const store = {
        findRedemption: async id => redemptions.get(id),
        saveIntent: async intent => intents.set(intent.intentId, intent),
        getIntent: async id => intents.get(id),
        recordConfirmed: async intent => {
            if (storageFailure) { storageFailure = false; throw new Error('database unavailable'); }
            if (!redemptions.has(intent.voucherId)) {
                redemptions.set(intent.voucherId, { transactionDigest: intent.digest }); recorded++;
            }
        },
    };
    const service = createQrRedemptionService({ client, store, packageId, registryId, secret, now: () => time });
    const app = express(); app.use(express.json());
    app.use('/api/redemptions', createQrRouter({ service,
        verifyApiKey(req, res, next) { if (req.headers['x-api-key'] !== 'merchant-test-key') return res.sendStatus(401); req.merchant = merchant; next(); },
        redemptionLimiter(req, res, next) { next(); },
    }));
    const payload = { voucherId, merchantId: 'clinic', amount: 999999, recipient: id('99') };
    const qr = () => JSON.stringify({ ...payload, signature: crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex') });
    return { app, qr, payload, fields, merchant, objects, intents, service,
        state: () => ({ recorded, executions, submitted }), expire: () => time += 700000,
        uncertain: () => uncertain = true, failEffects: () => effectsStatus = 'failure', failStorage: () => storageFailure = true,
        wrongEvent: () => wrongEvent = true };
}
async function prepare(f) {
    const response = await request(f.app).post('/api/redemptions/redeem-qr').set('X-API-Key', 'merchant-test-key').send({ qrPayload: f.qr() });
    assert.equal(response.status, 200, JSON.stringify(response.body));
    return response.body;
}
async function signed(intent, key = owner) {
    const approval = await key.signTransaction(Buffer.from(intent.transactionBytes, 'base64'));
    return { transactionBytes: approval.bytes, signature: approval.signature };
}

test('HTTP QR preparation -> real owner signature -> confirmed recording -> idempotent retry', async () => {
    const f = fixture(), intent = await prepare(f);
    assert.equal(intent.owner, owner.toSuiAddress());
    assert.equal(intent.amount, 100); // QR's stale/untrusted amount and recipient are not recorded.
    assert.deepEqual(f.state(), { recorded: 0, executions: 0, submitted: [] });
    const approval = await signed(intent);
    const submit = () => request(f.app).post(`/api/redemptions/qr-intents/${intent.intentId}/submit`).send(approval);
    const response = await submit();
    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.equal(response.body.transactionDigest, intent.digest);
    assert.equal((await submit()).status, 200);
    assert.equal(f.state().executions, 1); assert.equal(f.state().recorded, 1);
    assert.equal((await request(f.app).get(`/api/redemptions/qr-intents/${intent.intentId}`)).body.confirmed, true);
});
test('rejects wrong signer and modified transaction before submission', async () => {
    const f = fixture(), intent = await prepare(f);
    const wrong = await signed(intent, new Ed25519Keypair());
    const url = `/api/redemptions/qr-intents/${intent.intentId}/submit`;
    assert.equal((await request(f.app).post(url).send(wrong)).status, 403);
    const approval = await signed(intent);
    assert.equal((await request(f.app).post(url).send({ ...approval, transactionBytes: approval.transactionBytes + 'AA==' })).status, 400);
    assert.equal(f.state().executions, 0); assert.equal(f.state().recorded, 0);
});
test('merchant authentication, malformed QR, signature tampering, and wrong merchant fail', async () => {
    const f = fixture();
    assert.equal((await request(f.app).post('/api/redemptions/redeem-qr').send({ qrPayload: f.qr() })).status, 401);
    for (const qrPayload of ['null', '{', JSON.stringify({ ...f.payload, signature: 'a'.repeat(64) })]) {
        assert.equal((await request(f.app).post('/api/redemptions/redeem-qr').set('X-API-Key', 'merchant-test-key').send({ qrPayload })).status, 400);
    }
    f.payload.merchantId = 'another';
    await assert.rejects(f.service.prepare(f.qr(), f.merchant), error => error.status === 403);
});
test('rejects expired voucher, wrong on-chain merchant and digest used as object ID', async () => {
    const f = fixture(); f.fields.expiry_timestamp = '1';
    await assert.rejects(f.service.prepare(f.qr(), f.merchant), error => error.status === 409);
    f.fields.expiry_timestamp = String(Date.now() + 86400000); f.fields.merchant_id = 'other';
    await assert.rejects(f.service.prepare(f.qr(), f.merchant), error => error.status === 403);
    f.fields.merchant_id = 'clinic'; f.merchant.onChainObjectId = digest;
    await assert.rejects(f.service.prepare(f.qr(), f.merchant), error => error.status === 400);
});
test('failed chain effects never create a redemption record', async () => {
    const f = fixture(), intent = await prepare(f); f.failEffects();
    const response = await request(f.app).post(`/api/redemptions/qr-intents/${intent.intentId}/submit`).send(await signed(intent));
    assert.equal(response.status, 409); assert.equal(f.state().recorded, 0);
});
test('timeout after execution recovers same digest without resubmitting, even after expiry', async () => {
    const f = fixture(), intent = await prepare(f); f.uncertain();
    const approval = await signed(intent), url = `/api/redemptions/qr-intents/${intent.intentId}/submit`;
    assert.equal((await request(f.app).post(url).send(approval)).status, 503);
    assert.equal(f.state().recorded, 0); f.expire();
    assert.equal((await request(f.app).post(url).send(approval)).status, 200);
    assert.equal(f.state().executions, 1); assert.equal(f.state().recorded, 1);
});
test('unsubmitted expired requests cannot execute', async () => {
    const f = fixture(), intent = await prepare(f); f.expire();
    assert.equal((await request(f.app).post(`/api/redemptions/qr-intents/${intent.intentId}/submit`).send(await signed(intent))).status, 410);
    assert.equal(f.state().executions, 0);
});

test('database failure after chain confirmation recovers without a second execution', async () => {
    const f = fixture(), intent = await prepare(f); f.failStorage();
    const approval = await signed(intent), url = `/api/redemptions/qr-intents/${intent.intentId}/submit`;
    assert.equal((await request(f.app).post(url).send(approval)).status, 500);
    assert.equal(f.state().recorded, 0);
    assert.equal((await request(f.app).post(url).send(approval)).status, 200);
    assert.equal(f.state().executions, 1); assert.equal(f.state().recorded, 1);
});
test('successful effects with a mismatched merchant event are never recorded', async () => {
    const f = fixture(), intent = await prepare(f); f.wrongEvent();
    assert.equal((await request(f.app).post(`/api/redemptions/qr-intents/${intent.intentId}/submit`).send(await signed(intent))).status, 409);
    assert.equal(f.state().recorded, 0);
});
