
const { suiClient } = require('../config/sui');
const { eventQueue } = require('../queues/eventProcessor');
const logger = require('../utils/logger');

const VOUCHER_PACKAGE_ID = process.env.VOUCHER_PACKAGE_ID;

let unsubscribe;

async function startListening() {
    logger.info('Starting blockchain event listener...');

    try {
        unsubscribe = await suiClient.subscribeEvent({
            filter: {
                Package: VOUCHER_PACKAGE_ID,
            },
            onMessage: (event) => {
                handleEvent(event);
            },
        });
        logger.info(`Subscribed to events from package: ${VOUCHER_PACKAGE_ID}`);
    } catch (error) {
        logger.error('Failed to subscribe to blockchain events:', error);
        // Implement retry logic with backoff
        setTimeout(startListening, 5000);
    }
}

function handleEvent(event) {
    const eventType = event.type.split('::')[2]; // e.g., 'VoucherRedeemed'
    logger.info(`Received event: ${eventType}`, { event });

    eventQueue.add(eventType, {
        eventType,
        data: {
            ...event.parsedJson,
            transactionId: event.id.txDigest
        }
    }).catch(error => {
        logger.error('Failed to add event to queue:', error);
    });
}

function stopListening() {
    if (unsubscribe) {
        unsubscribe().then(() => {
            logger.info('Stopped blockchain event listener.');
        }).catch(error => {
            logger.error('Failed to unsubscribe from blockchain events:', error);
        });
    }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
    stopListening();
    process.exit(0);
});

module.exports = { startListening, stopListening };
