const Favorite = require('../models/Favorite');
const { getPropertiesByIds } = require('../services/propertyService');

/**
 * Get favorite properties
 */
const getFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ travelerId: req.user.id }).sort({
      createdAt: -1,
    });

    // Get property details from Property Service
    const propertyIds = favorites.map((fav) => fav.propertyId);
    
    if (propertyIds.length === 0) {
      return res.json([]);
    }

    try {
      const properties = await getPropertiesByIds(propertyIds);
      res.json(properties);
    } catch (error) {
      // If Property Service is unavailable, return favorite IDs
      res.json(favorites.map((fav) => ({ propertyId: fav.propertyId })));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Add property to favorites
 */
const addFavorite = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    // Check if already favorited
    const existing = await Favorite.findOne({
      travelerId: req.user.id,
      propertyId,
    });

    if (existing) {
      return res.status(400).json({
        error: {
          message: 'Property already in favorites',
          code: 'ALREADY_FAVORITE',
          status: 400,
        },
      });
    }

    const favorite = await Favorite.create({
      travelerId: req.user.id,
      propertyId,
    });

    res.status(201).json({
      message: 'Property added to favorites',
      favorite,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove property from favorites
 */
const removeFavorite = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      travelerId: req.user.id,
      propertyId,
    });

    if (!favorite) {
      return res.status(404).json({
        error: {
          message: 'Favorite not found',
          code: 'FAVORITE_NOT_FOUND',
          status: 404,
        },
      });
    }

    res.json({
      message: 'Property removed from favorites',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
};

