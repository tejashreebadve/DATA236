const Property = require('../models/Property');
const { checkAvailability, blockDates, unblockDates } = require('../services/propertyService');

/**
 * Search properties
 */
const searchProperties = async (req, res, next) => {
  try {
    const { location, startDate, endDate, guests, minPrice, maxPrice, type, amenities } = req.query;

    // Build query
    const query = {};

    // Location filter
    if (location) {
      query.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.address': { $regex: location, $options: 'i' } },
        { 'location.country': { $regex: location, $options: 'i' } },
      ];
    }

    // Type filter
    if (type) {
      query.type = type;
    }

    // Guests filter
    if (guests) {
      query.maxGuests = { $gte: parseInt(guests) };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query['pricing.basePrice'] = {};
      if (minPrice) query['pricing.basePrice'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.basePrice'].$lte = parseFloat(maxPrice);
    }

    // Amenities filter
    if (amenities) {
      const amenityList = amenities.split(',').map((a) => a.trim());
      query.amenities = { $all: amenityList };
    }

    // Find properties
    let properties = await Property.find(query);

    // Filter by availability if dates provided
    if (startDate && endDate) {
      properties = properties.filter((property) =>
        checkAvailability(property, startDate, endDate)
      );
    }

    res.json(properties);
  } catch (error) {
    next(error);
  }
};

/**
 * Get property by ID
 */
const getPropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id).populate('ownerId', 'name email');

    if (!property) {
      return res.status(404).json({
        error: {
          message: 'Property not found',
          code: 'PROPERTY_NOT_FOUND',
          status: 404,
        },
      });
    }

    res.json(property);
  } catch (error) {
    next(error);
  }
};

/**
 * Get properties by owner
 */
const getPropertiesByOwner = async (req, res, next) => {
  try {
    const { ownerId } = req.params;
    const properties = await Property.find({ ownerId }).sort({ createdAt: -1 });

    res.json(properties);
  } catch (error) {
    next(error);
  }
};

/**
 * Create property
 */
const createProperty = async (req, res, next) => {
  try {
    const propertyData = {
      ...req.body,
      ownerId: req.user.id,
    };

    // Handle photos from multer
    if (req.files && req.files.length > 0) {
      propertyData.photos = req.files.map((file) => file.path || `/uploads/${file.filename}`);
    }

    const property = await Property.create(propertyData);

    res.status(201).json(property);
  } catch (error) {
    next(error);
  }
};

/**
 * Update property
 */
const updateProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({
        error: {
          message: 'Property not found',
          code: 'PROPERTY_NOT_FOUND',
          status: 404,
        },
      });
    }

    // Verify ownership
    if (property.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        error: {
          message: 'You do not have permission to update this property',
          code: 'FORBIDDEN',
          status: 403,
        },
      });
    }

    // Update fields
    Object.keys(req.body).forEach((key) => {
      if (key !== 'ownerId' && key !== '_id') {
        property[key] = req.body[key];
      }
    });

    // Handle new photos
    if (req.files && req.files.length > 0) {
      const newPhotos = req.files.map((file) => file.path || `/uploads/${file.filename}`);
      property.photos = [...property.photos, ...newPhotos];
    }

    await property.save();

    res.json(property);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete property
 */
const deleteProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({
        error: {
          message: 'Property not found',
          code: 'PROPERTY_NOT_FOUND',
          status: 404,
        },
      });
    }

    // Verify ownership
    if (property.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        error: {
          message: 'You do not have permission to delete this property',
          code: 'FORBIDDEN',
          status: 403,
        },
      });
    }

    await Property.findByIdAndDelete(id);

    res.json({
      message: 'Property deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check property availability
 */
const checkPropertyAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: {
          message: 'startDate and endDate are required',
          code: 'MISSING_DATES',
          status: 400,
        },
      });
    }

    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({
        error: {
          message: 'Property not found',
          code: 'PROPERTY_NOT_FOUND',
          status: 404,
        },
      });
    }

    const available = checkAvailability(property, startDate, endDate);

    res.json({
      available,
      message: available
        ? 'Property is available for the selected dates'
        : 'Property is not available for the selected dates',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchProperties,
  getPropertyById,
  getPropertiesByOwner,
  createProperty,
  updateProperty,
  deleteProperty,
  checkPropertyAvailability,
  blockDates,
  unblockDates,
};

