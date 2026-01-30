const Joi = require('joi');

/**
 * STEP 4: RESULT VALIDATION SCHEMAS
 * 
 * Admin declares result - strict validation
 */

const resultValidations = {
    /**
     * Declare Result Validation
     * 
     * POST /admin/results/:diamondId
     * 
     * Body is empty - only diamondId in URL
     * Diamond must exist and have bids
     */
    declareResult: Joi.object({
        // Empty body allowed - all logic is server-side
    }).allow(null),
};

module.exports = resultValidations;
