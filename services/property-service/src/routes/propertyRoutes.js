const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const { validate } = require('../middleware/validationMiddleware');
const { authenticate, requireOwner } = require('../middleware/authMiddleware');

const {
  searchProperties,
  getPropertyById,
  getPropertiesByOwner,
  createProperty,
  updateProperty,
  deleteProperty,
  checkPropertyAvailability,
} = require('../controllers/propertyController');

// Multer configuration for multiple file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'property-' + uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Public routes
router.get('/search', searchProperties);
router.get('/:id', getPropertyById);
router.get('/:id/availability', checkPropertyAvailability);
router.get('/owner/:ownerId', getPropertiesByOwner);

// Protected routes (owner only)
router.post(
  '/',
  authenticate,
  requireOwner,
  upload.array('photos', 10), // Max 10 photos
  [
    body('name').trim().notEmpty().withMessage('Property name is required'),
    body('type').isIn(['Apartment', 'House', 'Villa', 'Condo', 'Townhouse', 'Studio']),
    body('location.address').notEmpty().withMessage('Address is required'),
    body('location.city').notEmpty().withMessage('City is required'),
    body('location.state').isLength({ min: 2, max: 2 }).toUpperCase(),
    body('location.country').notEmpty().withMessage('Country is required'),
    body('pricing.basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
    body('bedrooms').isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),
    body('bathrooms').isFloat({ min: 0 }).withMessage('Bathrooms must be a non-negative number'),
    body('maxGuests').isInt({ min: 1 }).withMessage('Maximum guests must be at least 1'),
  ],
  validate,
  createProperty
);

router.put(
  '/:id',
  authenticate,
  requireOwner,
  upload.array('photos', 10),
  validate,
  updateProperty
);

router.delete('/:id', authenticate, requireOwner, deleteProperty);

module.exports = router;

