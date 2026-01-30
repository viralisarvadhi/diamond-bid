const jwt = require('jsonwebtoken');
const db = require('../models');

/**
 * ✅ AUTHENTICATE MIDDLEWARE
 * 
 * Purpose: Verify JWT and attach user to req.user
 * Does NOT block inactive users - they can still VIEW data
 * Inactive users blocked at ACTION level (isActiveUser middleware)
 * 
 * Flow:
 * 1. Extract JWT from Authorization header
 * 2. Verify JWT signature
 * 3. Fetch user from database
 * 4. Attach user to req.user
 * 5. Pass to next middleware/route
 */
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided',
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // Fetch user from DB
        const user = await db.User.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        // Attach user to request
        // ⚠️ Does NOT check is_active here
        // Level 2 authorization (is_active check) happens at route level with isActiveUser middleware
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
            error: error.message,
        });
    }
};

module.exports = authenticate;

