const express = require('express');
const authenticate = require('../../../middlewares/auth.middleware');
const { isAdmin } = require('../../../middlewares/role.middleware');
const {
    declareResult,
    getUserResult,
    getAdminResult,
    getAdminAllResults,
} = require('../controllers/resultController');

const router = express.Router();

/**
 * STEP 4: RESULT ROUTES
 * 
 * Admin declares winners, users view results
 * Tie-breaking is deterministic and backend-controlled
 */

// ==========================================
// ADMIN ROUTES (Admin Only)
// ==========================================

/**
 * 👑 DECLARE RESULT
 * POST /admin/results/:diamondId
 * 
 * Admin manually declares the winner
 * Applies tie-breaking rules: bid amount → updated_at → budget
 * Atomic: insert result + update diamond status to SOLD
 */
router.post(
    '/:diamondId',
    authenticate,
    isAdmin,
    declareResult
);

/**
 * 👑 GET RESULT (ADMIN)
 * GET /admin/results/:diamondId
 * 
 * Admin sees complete result with all winner details
 * Includes all bids for reference
 */
router.get(
    '/:diamondId',
    authenticate,
    isAdmin,
    getAdminResult
);

/**
 * 👑 GET ALL RESULTS (ADMIN)
 * GET /admin/results
 * 
 * Admin sees paginated list of all declared results
 * Sorted by declared_at DESC (newest first)
 */
router.get(
    '/',
    authenticate,
    isAdmin,
    getAdminAllResults
);

// ==========================================
// USER ROUTES (Authenticated - Any Role)
// ==========================================

/**
 * 🏆 GET RESULT (USER VIEW)
 * GET /user/results/:diamondId
 * 
 * User views result with visibility rules:
 * - Before declared: "Result will be declared soon"
 * - Winner: "You won" + bid amount
 * - Loser: "You lost" (NO winner details)
 * - Non-participant: "You did not participate"
 */
router.get(
    '/diamond/:diamondId',
    authenticate,
    getUserResult
);

module.exports = router;
