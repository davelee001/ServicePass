/**
 * Redemption Archival Script
 *
 * Moves old redemption records from the primary collection to
 * an ArchivedRedemption collection for long-term storage.
 *
 * Run with:
 *   node scripts/archiveRedemptions.js [days]
 *
 * If [days] is not provided, it will use:
 *   REDEMPTION_ARCHIVE_AFTER_DAYS env var, or default to 180 days.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const Redemption = require('../backend/src/models/Redemption');
const ArchivedRedemption = require('../backend/src/models/ArchivedRedemption');

const runArchival = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/servicepass';

        const maxPoolSize = parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10) || 10;
        const minPoolSize = parseInt(process.env.MONGODB_MIN_POOL_SIZE, 10) || 1;

        await mongoose.connect(mongoUri, {
            maxPoolSize,
            minPoolSize,
        });
        console.log(`Connected to MongoDB (poolSize=${maxPoolSize})`);

        const argDays = parseInt(process.argv[2], 10);
        const envDays = parseInt(process.env.REDEMPTION_ARCHIVE_AFTER_DAYS, 10);
        const archiveAfterDays = Number.isFinite(argDays)
            ? argDays
            : (Number.isFinite(envDays) ? envDays : 180);

        const batchEnv = parseInt(process.env.REDEMPTION_ARCHIVE_BATCH_SIZE, 10);
        const batchSize = Number.isFinite(batchEnv) ? batchEnv : 500;

        const cutoffDate = new Date(Date.now() - archiveAfterDays * 24 * 60 * 60 * 1000);

        console.log(`Archiving redemptions older than ${archiveAfterDays} days (before ${cutoffDate.toISOString()})`);
        console.log(`Batch size: ${batchSize}`);

        let totalArchived = 0;

        // Process in batches to avoid large memory usage
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const batch = await Redemption.find({ redeemedAt: { $lt: cutoffDate } })
                .sort({ redeemedAt: 1 })
                .limit(batchSize)
                .lean();

            if (!batch.length) {
                break;
            }

            const archiveDocs = batch.map(doc => ({
                voucherObjectId: doc.voucherObjectId,
                transactionDigest: doc.transactionDigest,
                merchantId: doc.merchantId,
                voucherType: doc.voucherType,
                amount: doc.amount,
                redeemedBy: doc.redeemedBy,
                redeemedAt: doc.redeemedAt,
                metadata: doc.metadata,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
            }));

            await ArchivedRedemption.insertMany(archiveDocs, { ordered: false });

            const ids = batch.map(doc => doc._id);
            await Redemption.deleteMany({ _id: { $in: ids } });

            totalArchived += batch.length;
            console.log(`Archived batch of ${batch.length} redemptions (total: ${totalArchived})`);
        }

        console.log(`Archival complete. Total redemptions archived: ${totalArchived}`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error during redemption archival:', error.message);
        process.exit(1);
    }
};

if (require.main === module) {
    runArchival();
}

module.exports = runArchival;
