const db = require('../../models');
const { Diamond, Bid, Result, sequelize } = db;
const { DIAMOND_STATUS, SUCCESS_MESSAGES } = require('../../utils/constants');

// Get all diamonds (Admin only)
exports.getAllDiamonds = async (req, res, next) => {
    try {
        // paranoid: true is set in model, so soft-deleted records are automatically excluded
        const diamonds = await Diamond.findAll({
            order: [['created_at', 'DESC']],
        });

        return res.status(200).json({
            success: true,
            data: diamonds,
        });
    } catch (error) {
        console.error('[DIAMOND] Error fetching diamonds:', error.message);
        next(error);
    }
};

// Create diamond (Admin only)
exports.createDiamond = async (req, res, next) => {
    try {
        const { diamond_name, base_price, bid_start_time, bid_end_time } = req.body;

        // Validate dates
        const startTime = new Date(bid_start_time);
        const endTime = new Date(bid_end_time);

        if (endTime <= startTime) {
            return res.status(400).json({
                success: false,
                message: 'Bid end time must be after start time',
            });
        }

        // Check for time slot conflicts with existing diamonds (ACTIVE or DRAFT)
        const conflictingDiamond = await Diamond.findOne({
            where: {
                status: {
                    [db.Sequelize.Op.in]: [DIAMOND_STATUS.DRAFT, DIAMOND_STATUS.ACTIVE],
                },
                [db.Sequelize.Op.or]: [
                    // New slot starts during existing slot
                    {
                        start_time: {
                            [db.Sequelize.Op.lte]: startTime,
                        },
                        end_time: {
                            [db.Sequelize.Op.gt]: startTime,
                        },
                    },
                    // New slot ends during existing slot
                    {
                        start_time: {
                            [db.Sequelize.Op.lt]: endTime,
                        },
                        end_time: {
                            [db.Sequelize.Op.gte]: endTime,
                        },
                    },
                    // New slot completely contains existing slot
                    {
                        start_time: {
                            [db.Sequelize.Op.gte]: startTime,
                        },
                        end_time: {
                            [db.Sequelize.Op.lte]: endTime,
                        },
                    },
                    // Existing slot completely contains new slot
                    {
                        start_time: {
                            [db.Sequelize.Op.lte]: startTime,
                        },
                        end_time: {
                            [db.Sequelize.Op.gte]: endTime,
                        },
                    },
                ],
            },
        });

        if (conflictingDiamond) {
            return res.status(400).json({
                success: false,
                message: `Time slot conflict: Diamond "${conflictingDiamond.diamond_name}" is already scheduled from ${conflictingDiamond.start_time} to ${conflictingDiamond.end_time}`,
                conflict: {
                    diamond_name: conflictingDiamond.diamond_name,
                    start_time: conflictingDiamond.start_time,
                    end_time: conflictingDiamond.end_time,
                },
            });
        }

        const diamond = await Diamond.create({
            diamond_name,
            base_price: parseFloat(base_price),
            start_time: startTime,
            end_time: endTime,
            status: DIAMOND_STATUS.DRAFT,
        });

        return res.status(201).json({
            success: true,
            message: 'Diamond created successfully',
            data: diamond,
        });
    } catch (error) {
        console.error('[DIAMOND] Error creating diamond:', error.message);
        next(error);
    }
};

// Activate diamond (DRAFT -> ACTIVE)
exports.activateDiamond = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { diamondId } = req.params;

        const diamond = await Diamond.findByPk(diamondId, { transaction });

        if (!diamond) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Diamond not found',
            });
        }

        if (diamond.status !== DIAMOND_STATUS.DRAFT) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Diamond must be in DRAFT status to activate. Current status: ${diamond.status}`,
            });
        }

        await diamond.update(
            { status: DIAMOND_STATUS.ACTIVE },
            { transaction }
        );

        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: 'Diamond activated successfully',
            data: diamond,
        });
    } catch (error) {
        await transaction.rollback();
        console.error('[DIAMOND] Error activating diamond:', error.message);
        next(error);
    }
};

// Close diamond (ACTIVE -> CLOSED)
exports.closeDiamond = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { diamondId } = req.params;

        const diamond = await Diamond.findByPk(diamondId, { transaction });

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
                message: `Diamond must be in ACTIVE status to close. Current status: ${diamond.status}`,
            });
        }

        await diamond.update(
            { status: DIAMOND_STATUS.CLOSED },
            { transaction }
        );

        await transaction.commit();

        // Check if there are upcoming DRAFT diamonds that could be activated earlier
        const now = new Date();
        const upcomingDiamonds = await Diamond.findAll({
            where: {
                status: DIAMOND_STATUS.DRAFT,
                start_time: {
                    [db.Sequelize.Op.gt]: now,
                },
            },
            order: [['start_time', 'ASC']],
            limit: 5,
        });

        const suggestions = upcomingDiamonds.length > 0 ? {
            hasUpcomingDiamonds: true,
            count: upcomingDiamonds.length,
            nextDiamond: upcomingDiamonds[0] ? {
                id: upcomingDiamonds[0].id,
                name: upcomingDiamonds[0].diamond_name,
                scheduledStart: upcomingDiamonds[0].start_time,
                scheduledEnd: upcomingDiamonds[0].end_time,
            } : null,
            message: `You have ${upcomingDiamonds.length} DRAFT diamond(s) scheduled. The next one "${upcomingDiamonds[0]?.diamond_name}" is scheduled to start at ${upcomingDiamonds[0]?.start_time}. You can reschedule it to start earlier if needed.`,
        } : {
            hasUpcomingDiamonds: false,
            count: 0,
            message: 'No upcoming DRAFT diamonds to reschedule.',
        };

        console.log(`[DIAMOND] ✓ Diamond closed early: ${diamond.diamond_name}`);
        if (suggestions.hasUpcomingDiamonds) {
            console.log(`[DIAMOND] ℹ️  ${suggestions.count} upcoming DRAFT diamond(s) available for early activation`);
        }

        return res.status(200).json({
            success: true,
            message: 'Diamond closed successfully',
            data: diamond,
            suggestions,
        });
    } catch (error) {
        await transaction.rollback();
        console.error('[DIAMOND] Error closing diamond:', error.message);
        next(error);
    }
};

// Get single diamond
exports.getDiamond = async (req, res, next) => {
    try {
        const { diamondId } = req.params;

        const diamond = await Diamond.findByPk(diamondId);

        if (!diamond) {
            return res.status(404).json({
                success: false,
                message: 'Diamond not found',
            });
        }

        return res.status(200).json({
            success: true,
            data: diamond,
        });
    } catch (error) {
        console.error('[DIAMOND] Error fetching diamond:', error.message);
        next(error);
    }
};

// Get available diamonds for users (ACTIVE, CLOSED, SOLD with bid & result info)
exports.getAvailableDiamonds = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const diamonds = await Diamond.findAll({
            where: {
                status: [DIAMOND_STATUS.ACTIVE, DIAMOND_STATUS.CLOSED, 'SOLD'],
            },
            order: [['start_time', 'ASC']],
        });

        // Enrich each diamond with user's bid and result info
        const enrichedDiamonds = await Promise.all(
            diamonds.map(async (diamond) => {
                const userBid = await Bid.findOne({
                    where: {
                        diamond_id: diamond.id,
                        user_id: userId,
                    },
                });

                const result = await Result.findOne({
                    where: {
                        diamond_id: diamond.id,
                    },
                });

                const isWinner = result ? result.winner_user_id === userId : false;

                return {
                    id: diamond.id,
                    diamond_name: diamond.diamond_name,
                    base_price: diamond.base_price,
                    status: diamond.status,
                    bid_start_time: diamond.start_time,
                    bid_end_time: diamond.end_time,
                    result_status: result ? 'DECLARED' : 'PENDING',
                    user_bid: userBid
                        ? {
                            bid_amount: userBid.bid_amount,
                            updated_at: userBid.updated_at,
                            result: result ? (isWinner ? 'WON' : 'LOST') : undefined,
                            is_winner: result ? isWinner : undefined,
                        }
                        : null,
                };
            })
        );

        return res.status(200).json({
            success: true,
            data: enrichedDiamonds,
        });
    } catch (error) {
        console.error('[DIAMOND] Error fetching available diamonds:', error.message);
        next(error);
    }
};

// Get single diamond detail for user (includes user's bid if exists)
exports.getUserDiamondDetail = async (req, res, next) => {
    try {
        const { diamondId } = req.params;
        const userId = req.user.id;

        const diamond = await Diamond.findByPk(diamondId);

        if (!diamond) {
            return res.status(404).json({
                success: false,
                message: 'Diamond not found',
            });
        }

        const userBid = await Bid.findOne({
            where: {
                diamond_id: diamondId,
                user_id: userId,
            },
        });

        const result = await Result.findOne({
            where: {
                diamond_id: diamondId,
            },
        });

        const isWinner = result ? result.winner_user_id === userId : false;
        const hasBid = Boolean(userBid);

        return res.status(200).json({
            success: true,
            data: {
                id: diamond.id,
                diamond_name: diamond.diamond_name,
                base_price: diamond.base_price,
                status: diamond.status,
                start_time: diamond.start_time,
                end_time: diamond.end_time,
                bid_start_time: diamond.start_time,
                bid_end_time: diamond.end_time,
                result_status: result ? 'DECLARED' : 'PENDING',
                user_bid: userBid
                    ? {
                        id: userBid.id,
                        bid_amount: userBid.bid_amount,
                        updated_at: userBid.updated_at,
                        result: result ? (isWinner ? 'WON' : 'LOST') : undefined,
                        is_winner: result ? isWinner : undefined,
                    }
                    : null,
            },
        });
    } catch (error) {
        console.error('[DIAMOND] Error fetching user diamond:', error.message);
        next(error);
    }
};

// Edit diamond (Admin only - DRAFT or CLOSED diamonds only)
exports.editDiamond = async (req, res, next) => {
    try {
        const { diamondId } = req.params;
        const { diamond_name, base_price } = req.body;

        const diamond = await Diamond.findByPk(diamondId);

        if (!diamond) {
            return res.status(404).json({
                success: false,
                message: 'Diamond not found',
            });
        }

        // Only allow editing DRAFT or CLOSED diamonds
        if (diamond.status !== DIAMOND_STATUS.DRAFT && diamond.status !== DIAMOND_STATUS.CLOSED) {
            return res.status(400).json({
                success: false,
                message: 'Only DRAFT or CLOSED diamonds can be edited. Active or Sold diamonds cannot be modified.',
            });
        }

        // Update diamond
        if (diamond_name) {
            diamond.diamond_name = diamond_name;
        }
        if (base_price !== undefined) {
            diamond.base_price = parseFloat(base_price);
        }

        await diamond.save();

        return res.status(200).json({
            success: true,
            message: 'Diamond updated successfully',
            data: diamond,
        });
    } catch (error) {
        console.error('[DIAMOND] Error editing diamond:', error.message);
        next(error);
    }
};

// Delete diamond (Admin only - DRAFT or CLOSED diamonds only)
// Uses soft delete with cascade to related records
exports.deleteDiamond = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { diamondId } = req.params;

        const diamond = await Diamond.findByPk(diamondId, { transaction });

        if (!diamond) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Diamond not found',
            });
        }

        // Only allow deleting DRAFT or CLOSED diamonds
        if (diamond.status !== DIAMOND_STATUS.DRAFT && diamond.status !== DIAMOND_STATUS.CLOSED) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Only DRAFT or CLOSED diamonds can be deleted',
            });
        }

        // CASCADE SOFT DELETE
        // Step 1: Soft delete all bid histories related to bids of this diamond
        await db.BidHistory.destroy({
            where: {
                bid_id: {
                    [db.Sequelize.Op.in]: db.sequelize.literal(
                        `(SELECT id FROM bids WHERE diamond_id = '${diamondId}')`
                    ),
                },
            },
            transaction,
        });

        // Step 2: Soft delete all bids for this diamond
        await db.Bid.destroy({
            where: {
                diamond_id: diamondId,
            },
            transaction,
        });

        // Step 3: Soft delete result for this diamond (if exists)
        await db.Result.destroy({
            where: {
                diamond_id: diamondId,
            },
            transaction,
        });

        // Step 4: Soft delete the diamond itself
        await diamond.destroy({ transaction });

        await transaction.commit();

        console.log(`[DIAMOND] ✓ Soft deleted diamond and all related records: ${diamondId}`);
        console.log(`[DIAMOND]   - Diamond: ${diamond.diamond_name}`);
        console.log(`[DIAMOND]   - Status at deletion: ${diamond.status}`);

        return res.status(200).json({
            success: true,
            message: 'Diamond and all related records deleted successfully',
        });
    } catch (error) {
        await transaction.rollback();
        console.error('[DIAMOND] Error deleting diamond:', error.message);
        next(error);
    }
};

// Reschedule diamond (Admin only - CLOSED diamonds can be rescheduled)
exports.rescheduleDiamond = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { diamondId } = req.params;
        const { diamond_name, base_price, bid_start_time, bid_end_time } = req.body;

        const diamond = await Diamond.findByPk(diamondId, { transaction });

        if (!diamond) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Diamond not found',
            });
        }

        // Only allow rescheduling CLOSED or DRAFT diamonds
        if (diamond.status !== DIAMOND_STATUS.CLOSED && diamond.status !== DIAMOND_STATUS.DRAFT) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Only CLOSED or DRAFT diamonds can be rescheduled. Active or Sold diamonds cannot be rescheduled.',
            });
        }

        // Validate dates
        const startTime = new Date(bid_start_time);
        const endTime = new Date(bid_end_time);

        if (endTime <= startTime) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Bid end time must be after start time',
            });
        }

        // Check for time slot conflicts with OTHER diamonds (exclude current diamond)
        const conflictingDiamond = await Diamond.findOne({
            where: {
                id: {
                    [db.Sequelize.Op.ne]: diamondId, // Exclude current diamond
                },
                status: {
                    [db.Sequelize.Op.in]: [DIAMOND_STATUS.DRAFT, DIAMOND_STATUS.ACTIVE],
                },
                [db.Sequelize.Op.or]: [
                    // New slot starts during existing slot
                    {
                        start_time: {
                            [db.Sequelize.Op.lte]: startTime,
                        },
                        end_time: {
                            [db.Sequelize.Op.gt]: startTime,
                        },
                    },
                    // New slot ends during existing slot
                    {
                        start_time: {
                            [db.Sequelize.Op.lt]: endTime,
                        },
                        end_time: {
                            [db.Sequelize.Op.gte]: endTime,
                        },
                    },
                    // New slot completely contains existing slot
                    {
                        start_time: {
                            [db.Sequelize.Op.gte]: startTime,
                        },
                        end_time: {
                            [db.Sequelize.Op.lte]: endTime,
                        },
                    },
                    // Existing slot completely contains new slot
                    {
                        start_time: {
                            [db.Sequelize.Op.lte]: startTime,
                        },
                        end_time: {
                            [db.Sequelize.Op.gte]: endTime,
                        },
                    },
                ],
            },
            transaction,
        });

        if (conflictingDiamond) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Time slot conflict: Diamond "${conflictingDiamond.diamond_name}" is already scheduled from ${conflictingDiamond.start_time} to ${conflictingDiamond.end_time}`,
                conflict: {
                    diamond_name: conflictingDiamond.diamond_name,
                    start_time: conflictingDiamond.start_time,
                    end_time: conflictingDiamond.end_time,
                },
            });
        }

        // Update diamond and reset to DRAFT (or keep DRAFT if already DRAFT)
        diamond.diamond_name = diamond_name || diamond.diamond_name;
        diamond.base_price = base_price !== undefined ? parseFloat(base_price) : diamond.base_price;
        diamond.start_time = startTime;
        diamond.end_time = endTime;
        diamond.status = DIAMOND_STATUS.DRAFT; // Always reset to DRAFT after rescheduling

        await diamond.save({ transaction });

        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: 'Diamond rescheduled successfully. Status set to DRAFT.',
            data: diamond,
        });
    } catch (error) {
        await transaction.rollback();
        console.error('[DIAMOND] Error rescheduling diamond:', error.message);
        next(error);
    }
};
