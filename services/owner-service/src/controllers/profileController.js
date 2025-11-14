const Owner = require('../models/Owner');

const getProfile = async (req, res, next) => {
  try {
    const owner = await Owner.findById(req.user.id);

    if (!owner) {
      return res.status(404).json({
        error: {
          message: 'Owner not found',
          code: 'OWNER_NOT_FOUND',
          status: 404,
        },
      });
    }

    res.json(owner);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, location, images } = req.body;

    const owner = await Owner.findById(req.user.id);

    if (!owner) {
      return res.status(404).json({
        error: {
          message: 'Owner not found',
          code: 'OWNER_NOT_FOUND',
          status: 404,
        },
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== owner.email) {
      const existingOwner = await Owner.findOne({ email });
      if (existingOwner) {
        return res.status(400).json({
          error: {
            message: 'Email already exists',
            code: 'EMAIL_EXISTS',
            status: 400,
          },
        });
      }
      owner.email = email;
    }

    // Update fields
    if (name) owner.name = name;
    if (phone !== undefined) owner.phone = phone;
    if (location !== undefined) owner.location = location;
    if (images !== undefined) owner.images = images;

    await owner.save();

    res.json(owner);
  } catch (error) {
    next(error);
  }
};

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

    const owner = await Owner.findById(req.user.id);

    if (!owner) {
      return res.status(404).json({
        error: {
          message: 'Owner not found',
          code: 'OWNER_NOT_FOUND',
          status: 404,
        },
      });
    }

    const imageUrl = req.file.path || `/uploads/${req.file.filename}`;
    owner.profilePicture = imageUrl;
    await owner.save();

    res.json({
      imageUrl: owner.profilePicture,
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

