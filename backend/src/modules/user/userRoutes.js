const express = require('express');
const userController = require('./userController');
const authenticate = require('../../middlewares/auth.middleware');
const { isAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

// GET all users (Admin only)
router.get('/', authenticate, isAdmin, userController.getAllUsers);

// GET single user (Admin only)
router.get('/:userId', authenticate, isAdmin, userController.getUser);

// PATCH activate user (Admin only)
router.patch('/:userId/activate', authenticate, isAdmin, userController.activateUser);

// PATCH deactivate user (Admin only)
router.patch('/:userId/deactivate', authenticate, isAdmin, userController.deactivateUser);

module.exports = router;
