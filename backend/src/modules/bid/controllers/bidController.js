const db = require('../../../models');
const { ERROR_MESSAGES, SUCCESS_MESSAGES, BID_RULES, DIAMOND_STATUS } = require('../../../utils/constants');
const { emitBidUpdate } = require('../../../utils/socket');

/**
 * STEP 3: BID CONTROLLER
 * 
 * Core bidding engine with transaction-safe logic
 * Every edit is logged, admin sees only newest bid per user
 */

/**
 * 🟢 PLACE BID
 * POST /user/bid
 * 
 * Creates first-time bid or returns existing (shouldn't happen due to unique constraint)
 */
const placeBid = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { diamond_id, bid_amount } = req.validatedData;
        const user_id = req.user.id;

        console.log(`[BID] User ${user_id} placing bid on diamond ${diamond_id}: ${bid_amount}`);

        // =====================================
        // Rule A: Diamond must exist and be ACTIVE
        // =====================================
        const diamond = await db.Diamond.findByPk(diamond_id, { transaction });

        if (!diamond) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Diamond not found',
            });
        }

        if (diamond.status !== DIAMOND_STATUS.ACTIVE) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Diamond is not accepting bids (Status: ${diamond.status})`,
            });
        }

        // =====================================
        // Rule B: Time window check
        // =====================================
        const now = new Date();

        if (diamond.start_time && now < diamond.start_time) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Bidding has not started yet',
            });
        }

        if (diamond.end_time && now > diamond.end_time) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: ERROR_MESSAGES.BID_EXPIRED,
            });
        }

        // =====================================
        // Rule C: Bid amount validation
        // =====================================
        if (bid_amount < diamond.base_price) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Bid amount must be at least ${diamond.base_price} (base price)`,
                required_minimum: diamond.base_price,
            });
        }

        // =====================================
        // Check if bid already exists for this user-diamond pair
        // =====================================
        const existingBid = await db.Bid.findOne(
            {
                where: {
                    user_id,
                    diamond_id,
                },
            },
            { transaction }
        );

        if (existingBid) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'You already have an active bid on this diamond. Use update endpoint instead.',
            });
        }

        // =====================================
        // Create bid (NEW BID - no history entry)
        // =====================================
        const bid = await db.Bid.create(
            {
                user_id,
                diamond_id,
                bid_amount,
            },
            { transaction }
        );

        await transaction.commit();

        console.log(`[BID] ✓ Bid placed: ${bid.id}`);

        // =====================================
        // EMIT REAL-TIME UPDATE TO ADMINS
        // =====================================
        const user = await db.User.findByPk(user_id);
        emitBidUpdate({
            event: 'bid_placed',
            bid_id: bid.id,
            diamond_id: bid.diamond_id,
            user_id: user_id,
            user_name: user ? user.name : 'Unknown User',
            bid_amount: bid.bid_amount,
            created_at: bid.created_at,
        });

        return res.status(201).json({
            success: true,
            message: SUCCESS_MESSAGES.BID_PLACED,
            data: {
                bid_id: bid.id,
                diamond_id: bid.diamond_id,
                bid_amount: bid.bid_amount,
                created_at: bid.created_at,
            },
        });
    } catch (error) {
        await transaction.rollback();

        console.error('[BID] Error placing bid:', error.message);

        // Handle unique constraint error (shouldn't happen due to prior check)
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'You already have an active bid on this diamond',
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error placing bid',
            error: error.message,
        });
    }
};

/**
 * 🟡 UPDATE BID
 * PUT /user/bid/:bidId
 * 
 * Updates existing bid and logs old → new in bid_history
 * Transaction ensures atomicity
 */
const updateBid = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { bidId } = req.params;
        const { bid_amount: new_amount } = req.validatedData;
        const user_id = req.user.id;

        console.log(`[BID] User ${user_id} updating bid ${bidId} to ${new_amount}`);

        // =====================================
        // Fetch bid with relations
        // =====================================
        const bid = await db.Bid.findByPk(bidId, {
            include: [
                {
                    association: 'diamond',
                },
            ],
            transaction,
        });

        if (!bid) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Bid not found',
            });
        }

        // =====================================
        // Security: User can only edit their own bids
        // =====================================
        if (bid.user_id !== user_id) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own bids',
            });
        }

        const diamond = bid.diamond;

        // =====================================
        // Rule A: Diamond must be ACTIVE
        // =====================================
        if (diamond.status !== DIAMOND_STATUS.ACTIVE) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Diamond is not accepting bids (Status: ${diamond.status})`,
            });
        }

        // =====================================
        // Rule B: Time window check
        // =====================================
        const now = new Date();

        if (diamond.start_time && now < diamond.start_time) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Bidding has not started yet',
            });
        }

        if (diamond.end_time && now > diamond.end_time) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: ERROR_MESSAGES.BID_EXPIRED,
            });
        }

        // =====================================
        // Rule C: Bid amount validation
        // =====================================
        if (new_amount < diamond.base_price) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Bid amount must be at least ${diamond.base_price} (base price)`,
                required_minimum: diamond.base_price,
            });
        }

        // =====================================
        // No point updating to same amount
        // =====================================
        if (parseFloat(bid.bid_amount) === parseFloat(new_amount)) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'New bid amount is same as current bid',
            });
        }

        // =====================================
        // TRANSACTION: Log history then update
        // =====================================
        // Step 1: Create history entry
        const old_bid_amount = bid.bid_amount;
        await db.BidHistory.create(
            {
                bid_id: bidId,
                old_amount: bid.bid_amount,
                new_amount: new_amount,
            },
            { transaction }
        );

        // Step 2: Update bid amount
        await bid.update(
            {
                bid_amount: new_amount,
            },
            { transaction }
        );

        await transaction.commit();

        console.log(`[BID] ✓ Bid updated: ${bidId} (${old_bid_amount} → ${new_amount})`);

        // =====================================
        // EMIT REAL-TIME UPDATE TO ADMINS
        // =====================================
        const user = await db.User.findByPk(user_id);
        emitBidUpdate({
            event: 'bid_updated',
            bid_id: bid.id,
            diamond_id: bid.diamond_id,
            user_id: user_id,
            user_name: user ? user.name : 'Unknown User',
            old_amount: old_bid_amount,
            new_amount: new_amount,
            updated_at: new Date(),
        });

        return res.status(200).json({
            success: true,
            message: SUCCESS_MESSAGES.BID_UPDATED,
            data: {
                bid_id: bid.id,
                old_amount: old_bid_amount,
                new_amount: new_amount,
                updated_at: new Date(),
            },
        });
    } catch (error) {
        await transaction.rollback();

        console.error('[BID] Error updating bid:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Error updating bid',
            error: error.message,
        });
    }
};

/**
 * 🔵 GET USER'S BID ON A DIAMOND
 * GET /user/bid/:diamondId
 * 
 * User sees only their current bid (read-only)
 * Includes diamond info but not bid history
 */
const getUserBid = async (req, res) => {
    try {
        const { diamondId } = req.params;
        const user_id = req.user.id;

        const bid = await db.Bid.findOne({
            where: {
                user_id,
                diamond_id: diamondId,
            },
            include: [
                {
                    association: 'diamond',
                    attributes: ['id', 'diamond_name', 'base_price', 'status', 'start_time', 'end_time'],
                },
            ],
        });

        if (!bid) {
            return res.status(404).json({
                success: false,
                message: 'You have not placed a bid on this diamond',
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                bid_id: bid.id,
                diamond: bid.diamond,
                bid_amount: bid.bid_amount,
                created_at: bid.created_at,
                updated_at: bid.updated_at,
            },
        });
    } catch (error) {
        console.error('[BID] Error fetching user bid:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Error fetching bid',
            error: error.message,
        });
    }
};

/**
 * 👑 GET ALL BIDS FOR A DIAMOND (ADMIN VIEW)
 * GET /admin/bids/:diamondId
 * 
 * Admin sees all active users' current bids only
 * No bid history here (append-only, for audit only)
 * Returns data sorted by bid amount (highest first)
 * If diamond is SOLD, includes winner information
 */
const getAdminBidsForDiamond = async (req, res) => {
    try {
        const { diamondId } = req.params;

        // Verify diamond exists
        const diamond = await db.Diamond.findByPk(diamondId);

        if (!diamond) {
            return res.status(404).json({
                success: false,
                message: 'Diamond not found',
            });
        }

        // Fetch all current bids for this diamond
        // ONLY newest bid per user (enforced by UNIQUE constraint)
        const bids = await db.Bid.findAll({
            where: {
                diamond_id: diamondId,
            },
            include: [
                {
                    association: 'user',
                    attributes: ['id', 'name', 'email', 'is_active'],
                },
            ],
            order: [['bid_amount', 'DESC']], // Highest first
        });

        // Get winner info if diamond is SOLD
        let winner = null;
        if (diamond.status === 'SOLD' || diamond.status === DIAMOND_STATUS.SOLD) {
            const result = await db.Result.findOne({
                where: {
                    diamond_id: diamondId,
                },
                include: [
                    {
                        association: 'winner',
                        attributes: ['id', 'name', 'email'],
                    },
                ],
            });

            if (result && result.winner) {
                winner = {
                    id: result.winner.id,
                    name: result.winner.name,
                    email: result.winner.email,
                    winning_amount: result.winning_bid_amount,
                };
            }
        }

        // Calculate stats
        const totalBids = bids.length;
        const highestBid = bids.length > 0 ? bids[0].bid_amount : null;
        const activeBids = bids.filter((b) => b.user.is_active === true).length;

        return res.status(200).json({
            success: true,
            diamond: {
                id: diamond.id,
                name: diamond.diamond_name,
                base_price: diamond.base_price,
                status: diamond.status,
            },
            stats: {
                total_bids: totalBids,
                active_bids: activeBids,
                highest_bid: highestBid,
            },
            winner,
            bids: bids.map((bid) => ({
                bid_id: bid.id,
                user: {
                    id: bid.user.id,
                    name: bid.user.name,
                    email: bid.user.email,
                    is_active: bid.user.is_active,
                },
                bid_amount: bid.bid_amount,
                created_at: bid.created_at,
                updated_at: bid.updated_at,
            })),
        });
    } catch (error) {
        console.error('[BID] Error fetching admin bids:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Error fetching bids',
            error: error.message,
        });
    }
};

/**
 * 👑 GET BID HISTORY (ADMIN VIEW - OPTIONAL)
 * GET /admin/bids/:bidId/history
 * 
 * Admin sees complete audit trail of bid edits
 * Used for disputes, audits, debugging
 */
const getAdminBidHistory = async (req, res) => {
    try {
        const { bidId } = req.params;

        // Fetch bid with history
        const bid = await db.Bid.findByPk(bidId, {
            include: [
                {
                    association: 'user',
                    attributes: ['id', 'name', 'email'],
                },
                {
                    association: 'diamond',
                    attributes: ['id', 'diamond_name'],
                },
                {
                    association: 'bidHistory',
                    attributes: ['id', 'old_amount', 'new_amount', 'edited_at'],
                },
            ],
        });

        if (!bid) {
            return res.status(404).json({
                success: false,
                message: 'Bid not found',
            });
        }

        return res.status(200).json({
            success: true,
            bid: {
                bid_id: bid.id,
                user: bid.user,
                diamond: bid.diamond,
                current_amount: bid.bid_amount,
                created_at: bid.created_at,
                updated_at: bid.updated_at,
            },
            history: bid.bidHistory.map((h) => ({
                history_id: h.id,
                old_amount: h.old_amount,
                new_amount: h.new_amount,
                edited_at: h.edited_at,
            })),
            total_edits: bid.bidHistory.length,
        });
    } catch (error) {
        console.error('[BID] Error fetching bid history:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Error fetching bid history',
            error: error.message,
        });
    }
};

module.exports = {
    placeBid,
    updateBid,
    getUserBid,
    getAdminBidsForDiamond,
    getAdminBidHistory,
};
