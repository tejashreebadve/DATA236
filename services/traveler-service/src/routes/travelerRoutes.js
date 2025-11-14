const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const { validate } = require('../middleware/validationMiddleware');
const { authenticate, requireTraveler } = require('../middleware/authMiddleware');

// Controllers
const {
  getProfile,
  updateProfile,
  uploadProfilePicture,
} = require('../controllers/profileController');

const {
  getBookings,
  getBooking,
  getHistory,
} = require('../controllers/bookingController');

const {
  getFavorites,
  addFavorite,
  removeFavorite,
} = require('../controllers/favoritesController');

// Multer configuration for file uploads
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Profile routes
router.get('/profile', authenticate, requireTraveler, getProfile);

router.put(
  '/profile',
  authenticate,
  requireTraveler,
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('name').optional().trim().notEmpty(),
    body('phone').optional().trim(),
    body('state').optional().isLength({ max: 2 }).toUpperCase(),
    body('gender')
      .optional()
      .isIn(['Male', 'Female', 'Other', 'Prefer not to say']),
  ],
  validate,
  updateProfile
);

router.post(
  '/profile/picture',
  authenticate,
  requireTraveler,
  upload.single('image'),
  uploadProfilePicture
);

// Booking routes
router.get('/bookings', authenticate, requireTraveler, getBookings);
router.get('/bookings/:id', authenticate, requireTraveler, getBooking);
router.get('/history', authenticate, requireTraveler, getHistory);

// Favorites routes
router.get('/favorites', authenticate, requireTraveler, getFavorites);
router.post('/favorites/:propertyId', authenticate, requireTraveler, addFavorite);
router.delete(
  '/favorites/:propertyId',
  authenticate,
  requireTraveler,
  removeFavorite
);

module.exports = router;

