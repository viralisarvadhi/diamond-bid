const Joi = require('joi');

// User validation schemas
const userValidations = {
    createUser: Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        role: Joi.string().valid('admin', 'user', 'manager').default('user'),
        status: Joi.string().valid('active', 'inactive').default('active'),
    }),

    updateUser: Joi.object({
        firstName: Joi.string(),
        lastName: Joi.string(),
        email: Joi.string().email(),
        role: Joi.string().valid('admin', 'user', 'manager'),
        status: Joi.string().valid('active', 'inactive'),
    }),

    getUserById: Joi.object({
        id: Joi.string().required(),
    }),
};

module.exports = userValidations;
