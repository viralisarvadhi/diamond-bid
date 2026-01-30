/**
 * ✅ IS USER MIDDLEWARE
 * 
 * Purpose: Check if user has USER role (not admin-only)
 * Used on user action routes
 * Returns 403 if user is admin trying to access user routes
 * 
 * Usage:
 * app.post('/user/bid', authenticate, isActiveUser, isUser, bidController)
 */
const isUser = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'User not authenticated',
        });
    }

    if (req.user.role !== 'USER') {
        return res.status(403).json({
            success: false,
            message: 'Only regular users can access this resource',
        });
    }

    next();
};

module.exports = isUser;
