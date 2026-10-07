const crypto = require('node:crypto');
const { Transaction } = require('@mysten/sui/transactions');
const { verifyTransactionSignature } = require('@mysten/sui/verify');
const { normalizeSuiAddress, normalizeSuiObjectId, SUI_CLOCK_OBJECT_ID } = require('@mysten/sui/utils');

class RedemptionError extends Error {
    constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new RedemptionError(status, message); };
const objectId = value => {
    if (typeof value !== 'string' || !/^0x[0-9a-f]{1,64}$/i.test(value)) fail(400, 'Invalid on-chain object ID');
    return normalizeSuiObjectId(value);
};
const text = value => typeof value === 'string' ? value : value?.fields?.bytes
    ? Buffer.from(value.fields.bytes).toString('utf8') : value?.fields?.value;

function createQrRedemptionService({ client, store, packageId, registryId, secret, now = Date.now }) {
    async function prepare(qrPayload, merchant) {
        if (typeof qrPayload !== 'string' || qrPayload.length > 16384) fail(400, 'Invalid QR payload');
        let parsed;
        try { parsed = JSON.parse(qrPayload); } catch { fail(400, 'Invalid QR payload'); }
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) fail(400, 'Invalid QR payload');
        const { signature, ...payload } = parsed;
        const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest();
        if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature) ||
            !crypto.timingSafeEqual(expected, Buffer.from(signature, 'hex'))) fail(400, 'Invalid QR signature');
        if (!merchant?.isActive || payload.merchantId !== merchant.merchantId) fail(403, 'Voucher not valid for this merchant');
        const voucherId = objectId(payload.voucherId);
        const merchantObjectId = objectId(merchant.onChainObjectId);
        if (await store.findRedemption(voucherId)) fail(409, 'Voucher already redeemed');
        const [voucherResult, merchantResult, registryResult, clockResult] = await Promise.all([
            client.getObject({ id: voucherId, options: { showContent: true, showOwner: true } }),
            client.getObject({ id: merchantObjectId, options: { showContent: true, showOwner: true } }),
            client.getObject({ id: objectId(registryId), options: { showContent: true, showOwner: true } }),
            client.getObject({ id: SUI_CLOCK_OBJECT_ID, options: { showContent: true, showOwner: true } }),
        ]);
        const voucher = voucherResult.data;
        const onChainMerchant = merchantResult.data;
        if (!voucher || voucher.content?.type !== `${packageId}::voucher_system::Voucher`) fail(404, 'Voucher object not found');
        if (!onChainMerchant || onChainMerchant.content?.type !== `${packageId}::voucher_system::Merchant` ||
            !onChainMerchant.owner?.Shared || text(onChainMerchant.content.fields.merchant_id) !== merchant.merchantId) {
            fail(409, 'Merchant on-chain object is not configured correctly');
        }
        const fields = voucher.content.fields;
        const owner = voucher.owner?.AddressOwner;
        if (!owner) fail(409, 'Voucher must be held by an address owner');
        if (text(fields.merchant_id) !== merchant.merchantId) fail(403, 'On-chain voucher belongs to another merchant');
        if (fields.is_redeemed || BigInt(fields.expiry_timestamp) <= BigInt(now())) fail(409, 'Voucher is redeemed or expired');
        const amount = Number(fields.amount);
        const voucherType = Number(fields.voucher_type);
        if (!Number.isSafeInteger(amount) || amount <= 0 || ![1, 2, 3, 4].includes(voucherType)) fail(409, 'Invalid voucher value');
        if (!onChainMerchant.content.fields.voucher_types_accepted.map(Number).includes(voucherType)) fail(403, 'Merchant does not accept this voucher type');
        const registry = registryResult.data;
        if (!registry?.owner?.Shared || registry.content?.type !== `${packageId}::voucher_system::VoucherRegistry`) fail(409, 'Registry must be the configured shared object');
        const gasBudget = 20000000;
        const [gasPrice, coins] = await Promise.all([
            client.getReferenceGasPrice(), client.getCoins({ owner, coinType: '0x2::sui::SUI' }),
        ]);
        const gasCoin = coins.data.find(coin => BigInt(coin.balance) >= BigInt(gasBudget));
        if (!gasCoin) fail(409, 'Owner needs a SUI coin with at least 0.02 SUI for gas');
        const transaction = new Transaction();
        transaction.setSender(owner);
        transaction.setGasBudget(gasBudget);
        transaction.setGasPrice(gasPrice);
        transaction.setGasPayment([{ objectId: gasCoin.coinObjectId, version: gasCoin.version, digest: gasCoin.digest }]);
        transaction.moveCall({
            target: `${packageId}::voucher_system::redeem_voucher`,
            // TxContext is implicit. All three explicit arguments are objects.
            arguments: [
                transaction.sharedObjectRef({ objectId: objectId(registryId), initialSharedVersion: registry.owner.Shared.initial_shared_version, mutable: true }),
                transaction.sharedObjectRef({ objectId: merchantObjectId, initialSharedVersion: onChainMerchant.owner.Shared.initial_shared_version, mutable: true }),
                transaction.objectRef({ objectId: voucherId, version: voucher.version, digest: voucher.digest }),
            ],
        });
        const bytes = await transaction.build({ client });
        const digest = await Transaction.from(bytes).getDigest();
        const intent = {
            intentId: crypto.randomBytes(24).toString('hex'),
            transactionBytes: Buffer.from(bytes).toString('base64'), digest,
            owner: normalizeSuiAddress(owner), voucherId, merchantObjectId,
            merchantId: merchant.merchantId, voucherType, amount,
            expiresAt: new Date(now() + 10 * 60 * 1000),
        };
        await store.saveIntent(intent);
        return publicIntent(intent);
    }
    function publicIntent(intent) {
        return { intentId: intent.intentId, transactionBytes: intent.transactionBytes, owner: intent.owner,
            digest: intent.digest, merchantId: intent.merchantId, voucherId: intent.voucherId,
            amount: intent.amount, voucherType: intent.voucherType, expiresAt: intent.expiresAt };
    }
    async function getIntent(intentId) {
        const intent = await store.getIntent(intentId);
        if (!intent) fail(404, 'Redemption request not found');
        const existing = await store.findRedemption(intent.voucherId);
        if (existing?.transactionDigest === intent.digest) return { ...publicIntent(intent), confirmed: true };
        if (new Date(intent.expiresAt).getTime() <= now()) fail(410, 'Redemption request expired');
        return { ...publicIntent(intent), confirmed: false };
    }
    async function submit(intentId, transactionBytes, signature) {
        const intent = await store.getIntent(intentId);
        if (!intent) fail(404, 'Redemption request not found');
        if (transactionBytes !== intent.transactionBytes) fail(400, 'Signed transaction differs from the prepared redemption');
        const bytes = Buffer.from(transactionBytes, 'base64');
        try { await verifyTransactionSignature(bytes, signature, { address: intent.owner }); }
        catch { fail(403, 'Transaction must be signed by the voucher owner'); }
        const existing = await store.findRedemption(intent.voucherId);
        if (existing) {
            if (existing.transactionDigest !== intent.digest) fail(409, 'Voucher already redeemed');
            await store.recordConfirmed(intent);
            return { success: true, transactionDigest: intent.digest, alreadyRecorded: true };
        }
        // An ambiguous prior submission can be recovered even after the request window.
        let result;
        try { result = await client.getTransactionBlock({ digest: intent.digest, options: { showEffects: true, showEvents: true, showInput: true } }); }
        catch (error) {
            if (!/not found|could not find|does not exist/i.test(error.message)) fail(503, 'Unable to check transaction status; retry the same request');
        }
        if (!result) {
            if (new Date(intent.expiresAt).getTime() <= now()) fail(410, 'Redemption request expired');
            try {
                result = await client.executeTransactionBlock({ transactionBlock: transactionBytes, signature,
                    options: { showEffects: true, showEvents: true, showInput: true }, requestType: 'WaitForLocalExecution' });
            } catch { fail(503, 'Submission status uncertain; retry the same signed transaction'); }
        }
        if (result.digest !== intent.digest || result.effects?.status?.status !== 'success') fail(409, 'On-chain redemption did not succeed');
        const event = result.events?.find(event => event.type === `${packageId}::voucher_system::VoucherRedeemed` &&
            typeof event.parsedJson?.voucher_id === 'string' &&
            /^0x[0-9a-f]{1,64}$/i.test(event.parsedJson.voucher_id) &&
            normalizeSuiObjectId(event.parsedJson.voucher_id) === intent.voucherId);
        if (!event || text(event.parsedJson.merchant_id) !== intent.merchantId ||
            Number(event.parsedJson.amount) !== intent.amount || Number(event.parsedJson.voucher_type) !== intent.voucherType) {
            fail(409, 'Confirmed transaction does not contain the expected redemption event');
        }
        await store.recordConfirmed(intent);
        return { success: true, transactionDigest: intent.digest };
    }
    return { prepare, getIntent, submit };
}
module.exports = { createQrRedemptionService, RedemptionError };
