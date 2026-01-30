const bcrypt = require('bcryptjs');
const User = require('../../models').User;
const { generateToken } = require('../../utils/jwt.utils');
const { SUCCESS_MESSAGES, ERROR_MESSAGES, USER_ROLES } = require('../../utils/constants');

// Login controller
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Compare passwords
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Generate JWT token
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            is_active: user.is_active,
        });

        return res.status(200).json({
            success: true,
            message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    is_active: user.is_active,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// Register controller (if needed)
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, budget } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered',
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with USER role and provided budget
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'USER',
            budget: budget || 0,
            is_active: true,
        });

        // Generate token
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            is_active: user.is_active,
        });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    budget: user.budget,
                    is_active: user.is_active,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};
