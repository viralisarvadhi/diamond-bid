const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 * @param {Object} user - User object with id and role
 * @returns {string} JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        process.env.JWT_SECRET || 'your-secret-key',
        {
            expiresIn: process.env.JWT_EXPIRY || '7d',
        }
    );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
        throw new Error('Invalid token: ' + error.message);
    }
};

/**
 * Decode JWT without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded token
 */
const decodeToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    generateToken,
    verifyToken,
    decodeToken,
};
