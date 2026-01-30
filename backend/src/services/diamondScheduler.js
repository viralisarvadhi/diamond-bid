const db = require('../models');
const { DIAMOND_STATUS } = require('../utils/constants');
const { Op } = require('sequelize');

/**
 * AUTOMATIC DIAMOND ACTIVATION & CLOSURE SERVICE
 * 
 * This service runs every minute to:
 * 1. Activate DRAFT diamonds when start_time is reached
 * 2. Close ACTIVE diamonds when end_time is reached
 * 
 * Admin only needs to set times - no manual activation needed!
 */

/**
 * Activate all draft diamonds whose start_time has arrived
 */
const activatePendingDiamonds = async () => {
    try {
        const now = new Date();

        // Find all DRAFT diamonds where start_time has arrived
        const pendingDiamonds = await db.Diamond.findAll({
            where: {
                status: DIAMOND_STATUS.DRAFT,
                start_time: {
                    [Op.lte]: now, // Less than or equal to current time
                },
            },
        });

        if (pendingDiamonds.length === 0) {
            return;
        }

        console.log(`[SCHEDULER] Found ${pendingDiamonds.length} diamond(s) to activate`);

        // Update each pending diamond to ACTIVE status
        for (const diamond of pendingDiamonds) {
            await diamond.update({
                status: DIAMOND_STATUS.ACTIVE,
            });

            console.log(`[SCHEDULER] ✓ Activated diamond: ${diamond.diamond_name} (ID: ${diamond.id})`);
        }

        console.log(`[SCHEDULER] Successfully activated ${pendingDiamonds.length} diamond(s)`);
    } catch (error) {
        console.error('[SCHEDULER] Error activating pending diamonds:', error.message);
    }
};

/**
 * Close all active diamonds that have passed their end_time
 */
const closeExpiredDiamonds = async () => {
    try {
        const now = new Date();

        // Find all ACTIVE diamonds where end_time has passed
        const expiredDiamonds = await db.Diamond.findAll({
            where: {
                status: DIAMOND_STATUS.ACTIVE,
                end_time: {
                    [Op.lte]: now, // Less than or equal to current time
                },
            },
        });

        if (expiredDiamonds.length === 0) {
            return;
        }

        console.log(`[SCHEDULER] Found ${expiredDiamonds.length} expired diamond(s) to close`);

        // Update each expired diamond to CLOSED status
        for (const diamond of expiredDiamonds) {
            await diamond.update({
                status: DIAMOND_STATUS.CLOSED,
            });

            console.log(`[SCHEDULER] ✓ Closed diamond: ${diamond.diamond_name} (ID: ${diamond.id})`);
        }

        console.log(`[SCHEDULER] Successfully closed ${expiredDiamonds.length} expired diamond(s)`);
    } catch (error) {
        console.error('[SCHEDULER] Error closing expired diamonds:', error.message);
    }
};

/**
 * Run both activation and closure checks
 */
const processDiamondSchedules = async () => {
    console.log('[SCHEDULER] Checking diamond schedules...');
    await activatePendingDiamonds();
    await closeExpiredDiamonds();
};

/**
 * Start the scheduler to run every minute
 */
const startDiamondScheduler = () => {
    console.log('[SCHEDULER] Starting automatic diamond activation & closure service...');

    // Run immediately on startup
    processDiamondSchedules();

    // Then run every 1 minute (60000 ms)
    setInterval(processDiamondSchedules, 60000);

    console.log('[SCHEDULER] ✓ Scheduler activated - checking every 60 seconds');
};

module.exports = {
    startDiamondScheduler,
    activatePendingDiamonds,
    closeExpiredDiamonds,
};
