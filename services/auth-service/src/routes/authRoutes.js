const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');
const {
  registerTraveler,
  registerOwner,
  loginTraveler,
  loginOwner,
  refreshAccessToken,
  verifyJWT,
} = require('../controllers/authController');

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
];

// Routes
router.post(
  '/register/traveler',
  registerValidation,
  validate,
  registerTraveler
);

router.post(
  '/register/owner',
  registerValidation,
  validate,
  registerOwner
);

router.post(
  '/login/traveler',
  loginValidation,
  validate,
  loginTraveler
);

router.post(
  '/login/owner',
  loginValidation,
  validate,
  loginOwner
);

router.post(
  '/refresh',
  refreshTokenValidation,
  validate,
  refreshAccessToken
);

router.post('/verify', verifyJWT);
router.get('/verify', verifyJWT); // Also support GET for frontend compatibility

module.exports = router;

