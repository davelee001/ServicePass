
const { Worker, Queue } = require('bullmq');
const IORedis = require('ioredis');
const Redemption = require('../models/Redemption');
const { suiClient } = require('../config/sui');
const logger = require('../utils/logger');

const connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null
});

const eventQueue = new Queue('blockchain-events', { connection });

const worker = new Worker('blockchain-events', async job => {
    const { eventType, data } = job.data;
    logger.info(`Processing event: ${eventType}`, data);

    try {
        switch (eventType) {
            case 'VoucherRedeemed':
                await handleVoucherRedemption(data);
                break;
            // Add other event types here
            default:
                logger.warn(`Unknown event type: ${eventType}`);
        }
    } catch (error) {
        logger.error(`Failed to process event ${job.id} of type ${eventType}:`, error);
        throw error; // BullMQ will retry the job
    }
}, { connection });

async function handleVoucherRedemption(data) {
    const { voucherId, redeemer, transactionId } = data;

    // Avoid duplicate processing
    const existingRedemption = await Redemption.findOne({ transactionId });
    if (existingRedemption) {
        logger.info(`Redemption for transaction ${transactionId} already processed.`);
        return;
    }

    // Fetch transaction details for more robust data
    const txn = await suiClient.getTransactionBlock({
        digest: transactionId,
        options: { showEffects: true, showEvents: true },
    });

    if (!txn || txn.effects?.status?.status !== 'success') {
        logger.error(`Transaction ${transactionId} failed or not found.`);
        throw new Error(`Transaction ${transactionId} failed or not found.`);
    }

    const newRedemption = new Redemption({
        voucher: voucherId,
        user: redeemer, // Assuming redeemer address can be mapped to a user
        transactionId: transactionId,
        status: 'confirmed',
    });

    await newRedemption.save();
    logger.info(`Successfully processed and saved redemption for voucher ${voucherId}`);
}

worker.on('completed', job => {
    logger.info(`Job ${job.id} has completed.`);
});

worker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} has failed with ${err.message}.`);
});

module.exports = { eventQueue };
