/**
 * ✅ IS ACTIVE USER MIDDLEWARE
 * 
 * Purpose: Check if user is ACTIVE (is_active = true)
 * Used ONLY on ACTION/MUTATION routes (POST, PUT, DELETE)
 * Returns 403 if user is deactivated by admin
 * 
 * Usage:
 * app.post('/user/bid', authenticate, isActiveUser, bidController)
 */
const isActiveUser = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'User not authenticated',
        });
    }

    // Level 2 Authorization: Check if user is active
    if (req.user.is_active !== true) {
        return res.status(403).json({
            success: false,
            message: 'User account is deactivated. Please contact admin.',
        });
    }

    next();
};

module.exports = isActiveUser;
