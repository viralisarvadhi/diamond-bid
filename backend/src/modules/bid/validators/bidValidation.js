const Joi = require('joi');

/**
 * STEP 3: BID VALIDATION SCHEMAS
 * 
 * Strict validation - only diamond_id and bid_amount allowed
 * No user_id, no timestamps - backend controls everything
 */

const bidValidations = {
    /**
     * Place Bid Validation
     * 
     * POST /user/bid
     * {
     *   "diamond_id": "uuid",
     *   "bid_amount": 50000
     * }
     */
    placeBid: Joi.object({
        diamond_id: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Invalid diamond ID format',
                'any.required': 'Diamond ID is required',
            }),

        bid_amount: Joi.number()
            .positive()
            .required()
            .messages({
                'number.positive': 'Bid amount must be greater than 0',
                'any.required': 'Bid amount is required',
            }),
    }),

    /**
     * Update Bid Validation
     * 
     * PUT /user/bid/:bidId
     * {
     *   "bid_amount": 60000
     * }
     */
    updateBid: Joi.object({
        bid_amount: Joi.number()
            .positive()
            .required()
            .messages({
                'number.positive': 'Bid amount must be greater than 0',
                'any.required': 'Bid amount is required',
            }),
    }),
};

module.exports = bidValidations;
