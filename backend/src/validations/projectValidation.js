const Joi = require('joi');

// Project validation schemas
const projectValidations = {
    createProject: Joi.object({
        name: Joi.string().required().messages({
            'any.required': 'Project name is required',
        }),
        description: Joi.string().allow(''),
        budget: Joi.number().positive().required().messages({
            'number.positive': 'Budget must be a positive number',
            'any.required': 'Budget is required',
        }),
        startDate: Joi.date().required(),
        endDate: Joi.date().min(Joi.ref('startDate')).required().messages({
            'date.min': 'End date must be after start date',
        }),
        status: Joi.string().valid('planning', 'in-progress', 'completed', 'on-hold').default('planning'),
    }),

    updateProject: Joi.object({
        name: Joi.string(),
        description: Joi.string().allow(''),
        budget: Joi.number().positive(),
        startDate: Joi.date(),
        endDate: Joi.date(),
        status: Joi.string().valid('planning', 'in-progress', 'completed', 'on-hold'),
    }),
};

module.exports = projectValidations;
