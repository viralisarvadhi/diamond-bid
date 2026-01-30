/**
 * ✅ IS ADMIN MIDDLEWARE
 * 
 * Purpose: Check if user has ADMIN role
 * Used on admin-only routes
 * Returns 403 if user is not admin
 * 
 * Usage:
 * app.post('/admin/declare-result', authenticate, isAdmin, declareResultController)
 */
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'User not authenticated',
        });
    }

    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Only admins can access this resource',
        });
    }

    next();
};

module.exports = isAdmin;
