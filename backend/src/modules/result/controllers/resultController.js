const db = require('../../../models');
const { ERROR_MESSAGES, SUCCESS_MESSAGES, DIAMOND_STATUS } = require('../../../utils/constants');
const { Op } = require('sequelize');

/**
 * STEP 4: RESULT CONTROLLER
 * 
 * Admin bid monitoring & result declaration
 * Winner determined by strict tie-breaking rules
 */

/**
 * 🧮 HELPER: Calculate Highest Bid (Backend Logic Only)
 * 
 * Does NOT declare result, only calculates.
 * Used for admin monitoring and result declaration.
 * 
 * Tie-breaking priority (STRICT ORDER):
 * 1️⃣ Highest bid amount
 * 2️⃣ Earliest updated_at (who reached that amount first)
 * 3️⃣ Highest user budget (fallback deterministic)
 */
const calculateHighestBid = async (diamondId) => {
    try {
        // Fetch all active bids for this diamond, with user data
        const bids = await db.Bid.findAll({
            where: { diamond_id: diamondId },
            include: [
                {
                    association: 'user',
                    attributes: ['id', 'name', 'email', 'budget', 'is_active'],
                },
            ],
        });

        if (bids.length === 0) {
            return null;
        }

        // Filter to only ACTIVE users
        const activeBids = bids.filter((bid) => bid.user.is_active === true);

        if (activeBids.length === 0) {
            return null;
        }

        // Sort by tie-breaking rules
        activeBids.sort((a, b) => {
            // Rule 1: Highest bid amount
            if (parseFloat(b.bid_amount) !== parseFloat(a.bid_amount)) {
                return parseFloat(b.bid_amount) - parseFloat(a.bid_amount);
            }

            // Rule 2: Earliest updated_at (who reached this amount first)
            if (new Date(a.updated_at).getTime() !== new Date(b.updated_at).getTime()) {
                return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
            }

            // Rule 3: Highest user budget
            if (parseFloat(b.user.budget) !== parseFloat(a.user.budget)) {
                return parseFloat(b.user.budget) - parseFloat(a.user.budget);
            }

            // Rule 4: User ID (lexicographic - ultimate deterministic fallback)
            return a.user.id.localeCompare(b.user.id);
        });

        const winnerBid = activeBids[0];

        return {
            bid_id: winnerBid.id,
            user_id: winnerBid.user.id,
            user_name: winnerBid.user.name,
            user_email: winnerBid.user.email,
            bid_amount: winnerBid.bid_amount,
            updated_at: winnerBid.updated_at,
            total_bids: bids.length,
            active_bids: activeBids.length,
        };
    } catch (error) {
        console.error('[RESULT] Error calculating highest bid:', error.message);
        throw error;
    }
};

/**
 * 👑 DECLARE RESULT
 * POST /admin/results/:diamondId
 * 
 * Admin manually declares the winner.
 * Atomic operation: find winner → insert result → update diamond status.
 * 
 * Business Rules:
 * 1. Diamond must exist
 * 2. Bid end_time must be passed
 * 3. Result not already declared
 * 4. At least one active bid must exist
 * 5. Apply tie-breaking logic
 */
const declareResult = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { diamondId } = req.params;

        console.log(`[RESULT] Admin declaring result for diamond: ${diamondId}`);

        // =====================================
        // Rule 1: Diamond must exist
        // =====================================
        const diamond = await db.Diamond.findByPk(diamondId, { transaction });

        if (!diamond) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Diamond not found',
            });
        }

        // =====================================
        // Rule 2: Bid end time must be passed OR diamond manually closed
        // =====================================
        const now = new Date();

        if (diamond.status !== DIAMOND_STATUS.CLOSED && diamond.end_time && now < diamond.end_time) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Cannot declare result before bidding period ends',
                end_time: diamond.end_time,
            });
        }

        // =====================================
        // Rule 3: Result not already declared
        // =====================================
        const existingResult = await db.Result.findOne(
            {
                where: { diamond_id: diamondId },
            },
            { transaction }
        );

        if (existingResult) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Result already declared for this diamond',
                winner: existingResult.winner_user_id,
                declared_at: existingResult.declared_at,
            });
        }

        // =====================================
        // Rule 4: At least one active bid
        // =====================================
        const winnerInfo = await calculateHighestBid(diamondId);

        if (!winnerInfo) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'No valid bids found to declare result',
            });
        }

        // =====================================
        // TRANSACTION: Insert result + update diamond status
        // =====================================

        // Step 1: Insert result
        const result = await db.Result.create(
            {
                diamond_id: diamondId,
                winner_user_id: winnerInfo.user_id,
                winning_bid_amount: winnerInfo.bid_amount,
            },
            { transaction }
        );

        // Step 2: Update diamond status to SOLD
        await diamond.update(
            {
                status: 'SOLD',
            },
            { transaction }
        );

        await transaction.commit();

        console.log(`[RESULT] ✓ Result declared: ${result.id} (Winner: ${winnerInfo.user_name})`);

        return res.status(201).json({
            success: true,
            message: SUCCESS_MESSAGES.RESULT_DECLARED,
            data: {
                result_id: result.id,
                diamond_id: result.diamond_id,
                diamond_name: diamond.diamond_name,
                winner_user_id: result.winner_user_id,
                winning_bid_amount: result.winning_bid_amount,
                total_bids: winnerInfo.total_bids,
                active_bids: winnerInfo.active_bids,
                declared_at: result.declared_at,
            },
        });
    } catch (error) {
        await transaction.rollback();

        console.error('[RESULT] Error declaring result:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Error declaring result',
            error: error.message,
        });
    }
};

/**
 * 🏆 GET RESULT FOR USER
 * GET /user/results/:diamondId
 * 
 * User views result (only after declared).
 * Visibility rules:
 * - Winner sees: "You won"
 * - Loser sees: "You lost" (NO winner details)
 */
const getUserResult = async (req, res) => {
    try {
        const { diamondId } = req.params;
        const user_id = req.user.id;

        // Fetch diamond
        const diamond = await db.Diamond.findByPk(diamondId);

        if (!diamond) {
            return res.status(404).json({
                success: false,
                message: 'Diamond not found',
            });
        }

        // Fetch result
        const result = await db.Result.findOne({
            where: { diamond_id: diamondId },
        });

        // Before result is declared
        if (!result) {
            return res.status(200).json({
                success: true,
                diamond: {
                    id: diamond.id,
                    name: diamond.diamond_name,
                    status: diamond.status,
                },
                result_status: 'pending',
                message: 'Result will be declared soon',
            });
        }

        // After result is declared
        const userBid = await db.Bid.findOne({
            where: {
                user_id,
                diamond_id: diamondId,
            },
        });

        // User did not bid
        if (!userBid) {
            return res.status(200).json({
                success: true,
                diamond: {
                    id: diamond.id,
                    name: diamond.diamond_name,
                    status: diamond.status,
                },
                result_status: 'declared',
                participation: 'not_participated',
                message: 'You did not participate in this auction',
            });
        }

        // User won
        if (user_id === result.winner_user_id) {
            return res.status(200).json({
                success: true,
                diamond: {
                    id: diamond.id,
                    name: diamond.diamond_name,
                    status: diamond.status,
                },
                result_status: 'declared',
                participation: 'won',
                your_bid_amount: userBid.bid_amount,
                message: 'Congratulations! You won this auction',
                declared_at: result.declared_at,
            });
        }

        // User lost
        return res.status(200).json({
            success: true,
            diamond: {
                id: diamond.id,
                name: diamond.diamond_name,
                status: diamond.status,
            },
            result_status: 'declared',
            participation: 'lost',
            your_bid_amount: userBid.bid_amount,
            message: 'Your bid did not win this auction',
            declared_at: result.declared_at,
        });
    } catch (error) {
        console.error('[RESULT] Error fetching user result:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Error fetching result',
            error: error.message,
        });
    }
};

/**
 * 👑 GET RESULT FOR ADMIN
 * GET /admin/results/:diamondId
 * 
 * Admin views complete result details including winner info.
 * Shows everything.
 */
const getAdminResult = async (req, res) => {
    try {
        const { diamondId } = req.params;

        const diamond = await db.Diamond.findByPk(diamondId);

        if (!diamond) {
            return res.status(404).json({
                success: false,
                message: 'Diamond not found',
            });
        }

        const result = await db.Result.findOne({
            where: { diamond_id: diamondId },
            include: [
                {
                    association: 'winner',
                    attributes: ['id', 'name', 'email', 'budget', 'is_active'],
                },
            ],
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Result not declared yet for this diamond',
            });
        }

        // Fetch all bids for reference
        const allBids = await db.Bid.findAll({
            where: { diamond_id: diamondId },
            include: [
                {
                    association: 'user',
                    attributes: ['id', 'name', 'email', 'is_active'],
                },
            ],
            order: [['bid_amount', 'DESC']],
        });

        return res.status(200).json({
            success: true,
            result: {
                result_id: result.id,
                diamond: {
                    id: diamond.id,
                    name: diamond.diamond_name,
                    base_price: diamond.base_price,
                    status: diamond.status,
                },
                winner: {
                    id: result.winner.id,
                    name: result.winner.name,
                    email: result.winner.email,
                    budget: result.winner.budget,
                    is_active: result.winner.is_active,
                },
                winning_bid_amount: result.winning_bid_amount,
                declared_at: result.declared_at,
            },
            all_bids: allBids.map((bid) => ({
                bid_id: bid.id,
                user: bid.user,
                bid_amount: bid.bid_amount,
                is_winner: bid.user.id === result.winner.id,
                created_at: bid.created_at,
                updated_at: bid.updated_at,
            })),
            total_bids: allBids.length,
        });
    } catch (error) {
        console.error('[RESULT] Error fetching admin result:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Error fetching result',
            error: error.message,
        });
    }
};

/**
 * 👑 GET ALL RESULTS (ADMIN VIEW)
 * GET /admin/results
 * 
 * Admin sees all declared results (paginated).
 */
const getAdminAllResults = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows } = await db.Result.findAndCountAll({
            include: [
                {
                    association: 'diamond',
                    attributes: ['id', 'diamond_name', 'base_price', 'status'],
                },
                {
                    association: 'winner',
                    attributes: ['id', 'name', 'email'],
                },
            ],
            order: [['declared_at', 'DESC']],
            limit,
            offset,
        });

        return res.status(200).json({
            success: true,
            pagination: {
                total: count,
                page,
                limit,
                pages: Math.ceil(count / limit),
            },
            results: rows.map((result) => ({
                result_id: result.id,
                diamond: result.diamond,
                winner: result.winner,
                winning_bid_amount: result.winning_bid_amount,
                declared_at: result.declared_at,
            })),
        });
    } catch (error) {
        console.error('[RESULT] Error fetching admin results:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Error fetching results',
            error: error.message,
        });
    }
};

module.exports = {
    declareResult,
    calculateHighestBid,
    getUserResult,
    getAdminResult,
    getAdminAllResults,
};
