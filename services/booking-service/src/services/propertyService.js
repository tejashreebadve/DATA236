const axios = require('axios');

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

const checkAvailability = async (propertyId, startDate, endDate) => {
  try {
    const response = await axios.get(
      `${PROPERTY_SERVICE_URL}/api/property/${propertyId}/availability?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data.available;
  } catch (error) {
    console.error('Error checking availability:', error.message);
    throw error;
  }
};

module.exports = {
  getPropertyById,
  checkAvailability,
};

