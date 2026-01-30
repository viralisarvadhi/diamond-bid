// Export all validation schemas
const authValidations = require('./authValidation');
const userValidations = require('./userValidation');
const projectValidations = require('./projectValidation');

module.exports = {
    authValidations,
    userValidations,
    projectValidations,
};
