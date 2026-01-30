/**
 * ✅ ROLE-BASED MIDDLEWARE
 * 
 * These middleware check user roles and status
 * Should ALWAYS come after authenticate middleware
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
            message: 'Your account is deactivated. Please contact admin.',
        });
    }

    next();
};

module.exports = { isAdmin, isUser, isActiveUser };

