const mongoose = require('mongoose');
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
    
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: {
          message: 'Invalid property ID format',
          code: 'INVALID_ID',
          status: 400,
        },
      });
    }
    
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
    // Extract photos first before spreading req.body
    const { photos, ...restBody } = req.body;
    
    const propertyData = {
      ...restBody,
      ownerId: req.user.id,
    };

    // Remove coordinates entirely if not provided or if null/undefined
    // This prevents MongoDB from trying to index null coordinates
    if (propertyData.location) {
      // Deep clone location to avoid mutating the original
      propertyData.location = { ...propertyData.location };
      
      // Check if coordinates exist and are valid
      if (propertyData.location.coordinates) {
        const coords = propertyData.location.coordinates;
        const lat = coords.lat;
        const lng = coords.lng;
        
        // If coordinates are null, undefined, or not valid numbers, remove them
        if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) {
          // Completely remove coordinates from the location object
          delete propertyData.location.coordinates;
        }
      }
    }

    // Handle photos from multer (file upload) OR from JSON body (URLs)
    if (req.files && req.files.length > 0) {
      // If files are uploaded via multer, use file paths
      propertyData.photos = req.files.map((file) => file.path || `/uploads/${file.filename}`);
    } else if (photos && Array.isArray(photos)) {
      // If photos are provided as URLs in JSON body, use them directly
      propertyData.photos = photos;
    } else {
      // Default to empty array if no photos provided
      propertyData.photos = [];
    }

    // Create property - coordinates will be omitted if they were removed above
    // The pre-save hook will also ensure coordinates are not null
    const property = await Property.create(propertyData);

    res.status(201).json(property);
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to parse nested objects from FormData bracket notation
 * Multer doesn't automatically parse bracket notation, so we need to do it manually
 */
const parseNestedFormData = (body) => {
  const parsed = { ...body };
  
  // Parse location[field] into location: { field: value }
  const locationKeys = Object.keys(body).filter(key => key.startsWith('location['));
  if (locationKeys.length > 0) {
    parsed.location = {};
    locationKeys.forEach(key => {
      const field = key.match(/location\[(\w+)\]/)?.[1];
      if (field) {
        parsed.location[field] = body[key];
        delete parsed[key];
      }
    });
  }
  
  // Parse pricing[field] into pricing: { field: value }
  const pricingKeys = Object.keys(body).filter(key => key.startsWith('pricing['));
  if (pricingKeys.length > 0) {
    parsed.pricing = parsed.pricing || {};
    pricingKeys.forEach(key => {
      const field = key.match(/pricing\[(\w+)\]/)?.[1];
      if (field) {
        parsed.pricing[field] = body[key];
        delete parsed[key];
      }
    });
  }
  
  // Parse availability[field] into availability: { field: value }
  const availabilityKeys = Object.keys(body).filter(key => key.startsWith('availability['));
  if (availabilityKeys.length > 0) {
    parsed.availability = parsed.availability || {};
    availabilityKeys.forEach(key => {
      const field = key.match(/availability\[(\w+)\]/)?.[1];
      if (field) {
        parsed.availability[field] = body[key];
        delete parsed[key];
      }
    });
  }
  
  // Parse amenities[] into amenities: [value1, value2, ...]
  const amenityKeys = Object.keys(body).filter(key => key === 'amenities[]' || key.startsWith('amenities['));
  if (amenityKeys.length > 0) {
    parsed.amenities = amenityKeys.map(key => body[key]).filter(v => v);
    amenityKeys.forEach(key => delete parsed[key]);
  }
  
  // Parse photos[] into photos: [url1, url2, ...]
  // Note: photos[] contains existing photo URLs (strings), not files
  // Files are handled separately via req.files
  const photoKeys = Object.keys(body).filter(key => key === 'photos[]' || key.startsWith('photos['));
  if (photoKeys.length > 0) {
    parsed.photos = photoKeys.map(key => body[key]).filter(v => v);
    photoKeys.forEach(key => delete parsed[key]);
  }
  
  return parsed;
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

    // Parse nested objects from FormData bracket notation
    const parsedBody = parseNestedFormData(req.body);

    // Update basic fields first
    Object.keys(parsedBody).forEach((key) => {
      if (key !== 'ownerId' && key !== '_id' && key !== 'photos' && key !== 'location' && key !== 'pricing' && key !== 'availability' && key !== 'amenities') {
        property[key] = parsedBody[key];
      }
    });

    // Handle location object
    if (parsedBody.location) {
      property.location = parsedBody.location;
      // Remove coordinates if not provided (same as createProperty)
      if (property.location.coordinates) {
        const coords = property.location.coordinates;
        if (coords.lat == null || coords.lng == null || isNaN(Number(coords.lat)) || isNaN(Number(coords.lng))) {
          delete property.location.coordinates;
        }
      }
    }

    // Handle pricing object
    if (parsedBody.pricing) {
      property.pricing = {
        ...property.pricing,
        ...parsedBody.pricing,
      };
    }

    // Handle availability object
    if (parsedBody.availability) {
      property.availability = {
        ...property.availability,
        ...parsedBody.availability,
      };
    }

    // Handle amenities array
    if (parsedBody.amenities) {
      property.amenities = Array.isArray(parsedBody.amenities) 
        ? parsedBody.amenities 
        : [parsedBody.amenities];
    }

    // Handle photos - prioritize new file uploads, then existing photos from body
    // parsedBody.photos contains existing photo URLs from photos[] in FormData
    const existingPhotoUrls = parsedBody.photos || [];
    const photosUpdated = parsedBody.photos_updated === 'true' || parsedBody.photos_updated === true;
    
    // Only update photos if photos_updated flag is set (meaning user intentionally managed photos)
    if (photosUpdated) {
      if (req.files && req.files.length > 0) {
        // If new files are uploaded, combine with existing photos from body
        const newPhotos = req.files.map((file) => file.path || `/uploads/${file.filename}`);
        property.photos = [...existingPhotoUrls, ...newPhotos];
      } else {
        // If no new files, use only existing photos (which might be empty if user removed all)
        property.photos = existingPhotoUrls.filter(p => p); // Remove empty values
      }
    } else if (req.files && req.files.length > 0) {
      // If photos_updated flag not set but new files uploaded, append to existing photos
      const newPhotos = req.files.map((file) => file.path || `/uploads/${file.filename}`);
      property.photos = [...(property.photos || []), ...newPhotos];
    }
    // If neither files nor photos_updated flag, keep existing photos (already set)

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

