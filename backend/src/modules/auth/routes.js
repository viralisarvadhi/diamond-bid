const express = require('express');
const authController = require('./authController');
const { validate } = require('../../middlewares/validation.middleware');
const { authValidations } = require('../../validations');

const router = express.Router();

// POST /auth/login
router.post('/login', validate(authValidations.login), authController.login);

// POST /auth/register
router.post('/register', validate(authValidations.register), authController.register);

module.exports = router;
