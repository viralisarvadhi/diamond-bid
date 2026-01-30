const Joi = require('joi');

const diamondValidations = {
    createDiamond: Joi.object({
        diamond_name: Joi.string().min(2).max(100).required().messages({
            'string.min': 'Diamond name must be at least 2 characters',
            'string.max': 'Diamond name must be at most 100 characters',
            'any.required': 'Diamond name is required',
        }),
        base_price: Joi.number().greater(0).required().messages({
            'number.base': 'Base price must be a number',
            'number.greater': 'Base price must be greater than 0',
            'any.required': 'Base price is required',
        }),
        bid_start_time: Joi.string().isoDate().required().messages({
            'string.isoDate': 'Bid start time must be a valid ISO date',
            'any.required': 'Bid start time is required',
        }),
        bid_end_time: Joi.string().isoDate().required().messages({
            'string.isoDate': 'Bid end time must be a valid ISO date',
            'any.required': 'Bid end time is required',
        }),
    }),

    activateDiamond: Joi.object({
        diamondId: Joi.string().uuid().required(),
    }),

    closeDiamond: Joi.object({
        diamondId: Joi.string().uuid().required(),
    }),
};

module.exports = diamondValidations;
