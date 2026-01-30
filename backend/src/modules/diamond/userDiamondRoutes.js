const express = require('express');
const diamondController = require('./diamondController');
const authenticate = require('../../middlewares/auth.middleware');

const router = express.Router();

// GET available diamonds for users (ACTIVE diamonds only)
router.get('/', authenticate, diamondController.getAvailableDiamonds);

// GET single diamond details for user (includes user's bid if exists)
router.get('/:diamondId', authenticate, diamondController.getUserDiamondDetail);

module.exports = router;
