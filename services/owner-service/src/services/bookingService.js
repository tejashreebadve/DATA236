const axios = require('axios');

const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:3005';
const PROPERTY_SERVICE_URL = process.env.PROPERTY_SERVICE_URL || 'http://localhost:3004';

const getOwnerBookings = async (ownerId, status = null) => {
  try {
    const url = status
      ? `${BOOKING_SERVICE_URL}/api/booking/owner/${ownerId}?status=${status}`
      : `${BOOKING_SERVICE_URL}/api/booking/owner/${ownerId}`;

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching owner bookings:', error.message);
    throw error;
  }
};

const getBookingById = async (bookingId) => {
  try {
    const response = await axios.get(`${BOOKING_SERVICE_URL}/api/booking/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching booking:', error.message);
    throw error;
  }
};

const updateBookingStatus = async (bookingId, status, token) => {
  try {
    const response = await axios.put(
      `${BOOKING_SERVICE_URL}/api/booking/${bookingId}/status`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating booking status:', error.message);
    throw error;
  }
};

const getOwnerProperties = async (ownerId) => {
  try {
    const response = await axios.get(`${PROPERTY_SERVICE_URL}/api/property/owner/${ownerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching owner properties:', error.message);
    throw error;
  }
};

module.exports = {
  getOwnerBookings,
  getBookingById,
  updateBookingStatus,
  getOwnerProperties,
};

