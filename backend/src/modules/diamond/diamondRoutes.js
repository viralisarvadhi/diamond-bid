const express = require('express');
const diamondController = require('./diamondController');
const { validate } = require('../../middlewares/validation.middleware');
const diamondValidations = require('./diamondValidation');
const { isAdmin } = require('../../middlewares/role.middleware');
const authenticate = require('../../middlewares/auth.middleware');

const router = express.Router();

// GET all diamonds (Admin)
router.get(
    '/',
    authenticate,
    isAdmin,
    diamondController.getAllDiamonds
);

// GET single diamond (Admin)
router.get(
    '/:diamondId',
    authenticate,
    isAdmin,
    diamondController.getDiamond
);

// POST create diamond (Admin)
router.post(
    '/',
    authenticate,
    isAdmin,
    validate(diamondValidations.createDiamond),
    diamondController.createDiamond
);

// PATCH activate diamond (Admin)
router.patch(
    '/:diamondId/activate',
    authenticate,
    isAdmin,
    diamondController.activateDiamond
);

// PATCH close diamond (Admin)
router.patch(
    '/:diamondId/close',
    authenticate,
    isAdmin,
    diamondController.closeDiamond
);

// PATCH edit diamond (Admin - DRAFT only)
router.patch(
    '/:diamondId/edit',
    authenticate,
    isAdmin,
    diamondController.editDiamond
);

// PATCH reschedule diamond (Admin - CLOSED only)
router.patch(
    '/:diamondId/reschedule',
    authenticate,
    isAdmin,
    validate(diamondValidations.createDiamond),
    diamondController.rescheduleDiamond
);

// DELETE diamond (Admin - DRAFT or CLOSED only)
router.delete(
    '/:diamondId',
    authenticate,
    isAdmin,
    diamondController.deleteDiamond
);

module.exports = router;
