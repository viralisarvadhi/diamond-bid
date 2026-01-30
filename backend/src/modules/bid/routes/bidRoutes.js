const express = require('express');
const authenticate = require('../../../middlewares/auth.middleware');
const { isActiveUser, isUser, isAdmin } = require('../../../middlewares/role.middleware');
const { validate } = require('../../../middlewares/validation.middleware');
const bidValidations = require('../validators/bidValidation');
const {
    placeBid,
    updateBid,
    getUserBid,
    getAdminBidsForDiamond,
    getAdminBidHistory,
} = require('../controllers/bidController');

const router = express.Router();

/**
 * STEP 3: BID ROUTES
 * 
 * Transaction-safe bidding with complete audit trail
 */

// ==========================================
// USER ROUTES (Authenticated, Active, Regular User)
// ==========================================

/**
 * 🟢 PLACE BID
 * POST /user/bid
 * 
 * Middleware chain: authenticate → isActiveUser → isUser → validate
 * Body: { diamond_id, bid_amount }
 */
router.post(
    '/',
    authenticate,
    isActiveUser,
    isUser,
    validate(bidValidations.placeBid),
    placeBid
);

/**
 * 🟡 UPDATE BID
 * PUT /user/bid/:bidId
 * 
 * Middleware chain: authenticate → isActiveUser → isUser → validate
 * Body: { bid_amount }
 * Params: bidId (from URL)
 */
router.put(
    '/:bidId',
    authenticate,
    isActiveUser,
    isUser,
    validate(bidValidations.updateBid),
    updateBid
);

/**
 * 🔵 GET USER'S BID ON A DIAMOND
 * GET /user/bid/:diamondId
 * 
 * Middleware: authenticate only (even inactive users can view)
 * Returns: Current bid for this user on this diamond
 */
router.get(
    '/diamond/:diamondId',
    authenticate,
    getUserBid
);

// ==========================================
// ADMIN ROUTES (Authenticated, Admin Role)
// ==========================================

/**
 * 👑 GET ALL BIDS FOR A DIAMOND (ADMIN)
 * GET /admin/bids/:diamondId
 * 
 * Middleware: authenticate → isAdmin
 * Returns: All current bids for this diamond (newest per user only)
 */
router.get(
    '/:diamondId',
    authenticate,
    isAdmin,
    getAdminBidsForDiamond
);

/**
 * 👑 GET BID HISTORY (ADMIN - AUDIT)
 * GET /admin/bids/:bidId/history
 * 
 * Middleware: authenticate → isAdmin
 * Returns: Complete edit history for this bid
 */
router.get(
    '/admin/history/:bidId',
    authenticate,
    isAdmin,
    getAdminBidHistory
);

module.exports = router;
