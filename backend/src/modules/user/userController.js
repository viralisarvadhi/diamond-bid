const db = require('../../models');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../../utils/constants');

/**
 * Get all users (Admin only)
 */
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await db.User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'budget', 'is_active', 'created_at', 'updated_at'],
            order: [['created_at', 'DESC']],
        });

        return res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single user (Admin only)
 */
exports.getUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await db.User.findByPk(userId, {
            attributes: ['id', 'name', 'email', 'role', 'budget', 'is_active', 'created_at', 'updated_at'],
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Activate user (Admin only)
 */
exports.activateUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await db.User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (user.is_active) {
            return res.status(400).json({
                success: false,
                message: 'User is already active',
            });
        }

        user.is_active = true;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'User activated successfully',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                is_active: user.is_active,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Deactivate user (Admin only)
 */
exports.deactivateUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await db.User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (!user.is_active) {
            return res.status(400).json({
                success: false,
                message: 'User is already inactive',
            });
        }

        user.is_active = false;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'User deactivated successfully',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                is_active: user.is_active,
            },
        });
    } catch (error) {
        next(error);
    }
};
