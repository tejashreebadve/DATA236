const axios = require('axios');

/**
 * Service to interact with Property Service
 */
const PROPERTY_SERVICE_URL = process.env.PROPERTY_SERVICE_URL || 'http://localhost:3004';

const getPropertyById = async (propertyId) => {
  try {
    const response = await axios.get(`${PROPERTY_SERVICE_URL}/api/property/${propertyId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching property:', error.message);
    throw error;
  }
};

const getPropertiesByIds = async (propertyIds) => {
  try {
    // Fetch multiple properties by IDs
    const promises = propertyIds.map((id) => getPropertyById(id));
    const properties = await Promise.all(promises);
    return properties.filter((p) => p !== null);
  } catch (error) {
    console.error('Error fetching properties:', error.message);
    throw error;
  }
};

module.exports = {
  getPropertyById,
  getPropertiesByIds,
};

