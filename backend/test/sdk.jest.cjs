// Verify the SDK's ESM exports load through our CommonJS Jest runtime.
const { Transaction } = require('@mysten/sui/transactions');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { verifyTransactionSignature } = require('@mysten/sui/verify');

test('Jest loads SDK 2 and verifies a real owner transaction signature', async () => {
    const owner = new Ed25519Keypair();
    const tx = new Transaction();
    tx.setSender(owner.toSuiAddress());
    tx.setGasBudget(20000000);
    tx.setGasPrice(1000);
    tx.setGasPayment([{ objectId: '0x5', version: '1', digest: '11111111111111111111111111111111' }]);
    const bytes = await tx.build();
    const signed = await owner.signTransaction(bytes);
    const publicKey = await verifyTransactionSignature(bytes, signed.signature, { address: owner.toSuiAddress() });
    expect(publicKey.toSuiAddress()).toBe(owner.toSuiAddress());
});
