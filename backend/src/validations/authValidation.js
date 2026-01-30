const Joi = require('joi');

// Auth validation schemas
const authValidations = {
    login: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email',
            'any.required': 'Email is required',
        }),
        password: Joi.string().min(6).required().messages({
            'string.min': 'Password must be at least 6 characters',
            'any.required': 'Password is required',
        }),
    }),

    register: Joi.object({
        name: Joi.string().min(2).max(100).required().messages({
            'string.min': 'Name must be at least 2 characters',
            'string.max': 'Name must be at most 100 characters',
            'any.required': 'Full name is required',
        }),
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email',
            'any.required': 'Email is required',
        }),
        password: Joi.string().min(6).required().messages({
            'string.min': 'Password must be at least 6 characters',
            'any.required': 'Password is required',
        }),
        budget: Joi.number().greater(0).required().messages({
            'number.base': 'Budget must be a number',
            'number.greater': 'Budget must be greater than 0',
            'any.required': 'Budget is required',
        }),
    }),

    resetPassword: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email',
            'any.required': 'Email is required',
        }),
    }),
};

module.exports = authValidations;
