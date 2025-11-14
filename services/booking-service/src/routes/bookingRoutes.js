const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');

const {
  createBooking,
  getBookingById,
  getTravelerBookings,
  getOwnerBookings,
  updateBookingStatus,
} = require('../controllers/bookingController');

// Create booking (authenticated - traveler or owner)
router.post(
  '/',
  authenticate,
  [
    body('propertyId').notEmpty().withMessage('Property ID is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('guests').isInt({ min: 1 }).withMessage('At least 1 guest is required'),
    body('totalPrice').isFloat({ min: 0 }).withMessage('Total price must be a positive number'),
  ],
  validate,
  createBooking
);

// Get booking by ID
router.get('/:id', getBookingById);

// Get traveler bookings
router.get('/traveler/:travelerId', getTravelerBookings);

// Get owner bookings
router.get('/owner/:ownerId', getOwnerBookings);

// Update booking status (protected - for internal use)
router.put(
  '/:id/status',
  authenticate,
  [
    body('status').isIn(['pending', 'accepted', 'cancelled']).withMessage('Invalid status'),
  ],
  validate,
  updateBookingStatus
);

module.exports = router;

