const Traveler = require('../models/Traveler');

/**
 * Get traveler profile
 */
const getProfile = async (req, res, next) => {
  try {
    const traveler = await Traveler.findById(req.user.id);

    if (!traveler) {
      return res.status(404).json({
        error: {
          message: 'Traveler not found',
          code: 'TRAVELER_NOT_FOUND',
          status: 404,
        },
      });
    }

    res.json(traveler);
  } catch (error) {
    next(error);
  }
};

/**
 * Update traveler profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      about,
      city,
      country,
      state,
      languages,
      gender,
    } = req.body;

    const traveler = await Traveler.findById(req.user.id);

    if (!traveler) {
      return res.status(404).json({
        error: {
          message: 'Traveler not found',
          code: 'TRAVELER_NOT_FOUND',
          status: 404,
        },
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== traveler.email) {
      const existingTraveler = await Traveler.findOne({ email });
      if (existingTraveler) {
        return res.status(400).json({
          error: {
            message: 'Email already exists',
            code: 'EMAIL_EXISTS',
            status: 400,
          },
        });
      }
      traveler.email = email;
    }

    // Update fields
    if (name) traveler.name = name;
    if (phone !== undefined) traveler.phone = phone;
    if (about !== undefined) traveler.about = about;
    if (city !== undefined) traveler.city = city;
    if (country !== undefined) traveler.country = country;
    if (state !== undefined) traveler.state = state?.toUpperCase();
    if (languages !== undefined) traveler.languages = languages;
    if (gender !== undefined) traveler.gender = gender;

    await traveler.save();

    res.json(traveler);
  } catch (error) {
    next(error);
  }
};

/**
 * Upload profile picture
 * Note: In production, this should upload to cloud storage (S3, Cloudinary, etc.)
 */
const uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: {
          message: 'No image file provided',
          code: 'NO_FILE',
          status: 400,
        },
      });
    }

    const traveler = await Traveler.findById(req.user.id);

    if (!traveler) {
      return res.status(404).json({
        error: {
          message: 'Traveler not found',
          code: 'TRAVELER_NOT_FOUND',
          status: 404,
        },
      });
    }

    // In production, upload to cloud storage and get URL
    // For now, using a placeholder URL or local file path
    const imageUrl = req.file.path || `/uploads/${req.file.filename}`;

    traveler.profilePicture = imageUrl;
    await traveler.save();

    res.json({
      imageUrl: traveler.profilePicture,
      message: 'Profile picture uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
};

