const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const { validate } = require('../middleware/validationMiddleware');
const { authenticate, requireOwner } = require('../middleware/authMiddleware');

// Controllers
const {
  getProfile,
  updateProfile,
  uploadProfilePicture,
} = require('../controllers/profileController');

const { getDashboard } = require('../controllers/dashboardController');

const {
  getBookings,
  getBooking,
  acceptBooking,
  cancelBooking,
} = require('../controllers/bookingController');

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'profile-' + uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Profile routes
router.get('/profile', authenticate, requireOwner, getProfile);

router.put(
  '/profile',
  authenticate,
  requireOwner,
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('name').optional().trim().notEmpty(),
    body('phone').optional().trim(),
  ],
  validate,
  updateProfile
);

router.post(
  '/profile/picture',
  authenticate,
  requireOwner,
  upload.single('image'),
  uploadProfilePicture
);

// Dashboard routes
router.get('/dashboard', authenticate, requireOwner, getDashboard);

// Booking routes
router.get('/bookings', authenticate, requireOwner, getBookings);
router.get('/bookings/:id', authenticate, requireOwner, getBooking);
router.put('/bookings/:id/accept', authenticate, requireOwner, acceptBooking);
router.put('/bookings/:id/cancel', authenticate, requireOwner, cancelBooking);

module.exports = router;

