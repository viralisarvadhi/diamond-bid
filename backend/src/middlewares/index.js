/**
 * MIDDLEWARE INDEX & USAGE GUIDE
 * 
 * This file exports all middlewares with clear usage patterns
 */

const authenticate = require('./auth.middleware');
const { isAdmin, isUser, isActiveUser } = require('./role.middleware');
const { validate } = require('./validation.middleware');

module.exports = {
    authenticate,
    isAdmin,
    isUser,
    isActiveUser,
    validate,
};

/**
 * 📖 MIDDLEWARE USAGE PATTERNS
 * 
 * Pattern 1: VIEW ROUTES (Read-only - even inactive users can view)
 * ─────────────────────────────────────
 * router.get('/diamonds', authenticate, getDiamondsController);
 * router.get('/user/bid/:diamondId', authenticate, getUserBidController);
 * 
 * Reason: Users should be able to see diamonds and their bids even if deactivated
 * 
 * 
 * Pattern 2: USER ACTION ROUTES (Write operations - blocked if inactive)
 * ───────────────────────────────────
 * router.post('/user/bid', authenticate, isActiveUser, isUser, placeBidController);
 * router.put('/user/bid/:bidId', authenticate, isActiveUser, isUser, updateBidController);
 * router.delete('/user/bid/:bidId', authenticate, isActiveUser, isUser, deleteBidController);
 * 
 * Reason: Only active users can place/modify bids
 * 
 * 
 * Pattern 3: ADMIN ROUTES (Admin-only operations)
 * ────────────────────────────
 * router.post('/admin/diamond', authenticate, isAdmin, createDiamondController);
 * router.post('/admin/result', authenticate, isAdmin, declareResultController);
 * router.put('/admin/user/:userId/activate', authenticate, isAdmin, activateUserController);
 * 
 * Reason: Only admins can modify system state
 * 
 * 
 * MIDDLEWARE STACKING ORDER (IMPORTANT)
 * ─────────────────────────────────────
 * Always: authenticate → (then role checks) → (then validation) → controller
 * 
 * Example:
 * router.post(
 *   '/user/bid',
 *   authenticate,        // 1. Who are you?
 *   isActiveUser,        // 2. Are you active?
 *   isUser,              // 3. Are you a regular user (not admin)?
 *   validate(bidSchema), // 4. Is your data valid?
 *   placeBidController   // 5. Execute business logic
 * );
 */
