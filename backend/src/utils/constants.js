/**
 * APPLICATION CONSTANTS
 * 
 * Centralized configuration for roles, statuses, and business rules
 */

// USER ROLES
const USER_ROLES = {
    ADMIN: 'ADMIN',
    USER: 'USER',
};

// DIAMOND STATUSES
const DIAMOND_STATUS = {
    DRAFT: 'DRAFT',     // Not yet accepting bids
    ACTIVE: 'ACTIVE',   // Currently accepting bids
    CLOSED: 'CLOSED',   // Bid period ended, not sold yet (admin hasn't declared)
    SOLD: 'SOLD',       // Result declared, diamond sold to winner
};

// USER STATUS
const USER_STATUS = {
    ACTIVE: true,
    INACTIVE: false,
};

// BID BUSINESS RULES
const BID_RULES = {
    // Bid amount must be > base_price
    MIN_BID_MULTIPLIER: 1,

    // Can only bid if diamond status is ACTIVE
    ALLOWED_BID_STATUS: [DIAMOND_STATUS.ACTIVE],

    // Can only bid if within time window
    CHECK_TIME_WINDOW: true,
};

// AUTHORIZATION RULES
const AUTH_RULES = {
    // Level 1: ACCESS (Viewing data)
    // Users can VIEW even if deactivated
    VIEW_ALLOWED_WHEN_INACTIVE: true,

    // Level 2: ACTION (Modifying data)
    // Users CANNOT bid/edit if deactivated
    ACTION_BLOCKED_WHEN_INACTIVE: true,

    // Result declaration rules
    RESULT_REQUIRES_ADMIN: true,
    RESULT_AUTO_DECLARE: false,  // Admin must manually declare
};

// RESULT DECLARATION LOGIC
const RESULT_RULES = {
    // Include inactive user bids when determining winner
    // Choose: true (include) or false (exclude)
    INCLUDE_INACTIVE_USER_BIDS: false,
};

// ERROR MESSAGES
const ERROR_MESSAGES = {
    UNAUTHORIZED: 'Not authenticated',
    FORBIDDEN: 'Access denied',
    USER_INACTIVE: 'User account is deactivated',
    NOT_ADMIN: 'Only admins can access this',
    NOT_USER: 'Only regular users can access this',
    INVALID_TOKEN: 'Invalid or expired token',
    BID_EXPIRED: 'Bidding period has ended',
    BID_AMOUNT_LOW: 'Bid amount must be greater than base price',
    DIAMOND_NOT_ACTIVE: 'Diamond is not accepting bids',
};

// SUCCESS MESSAGES
const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'Login successful',
    BID_PLACED: 'Bid placed successfully',
    BID_UPDATED: 'Bid updated successfully',
    RESULT_DECLARED: 'Result declared successfully',
};

module.exports = {
    USER_ROLES,
    DIAMOND_STATUS,
    USER_STATUS,
    BID_RULES,
    AUTH_RULES,
    RESULT_RULES,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
};

