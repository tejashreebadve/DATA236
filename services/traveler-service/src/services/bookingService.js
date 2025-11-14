const axios = require('axios');

/**
 * Service to interact with Booking Service
 */
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:3005';

const getTravelerBookings = async (travelerId, status = null) => {
  try {
    const url = status
      ? `${BOOKING_SERVICE_URL}/api/booking/traveler/${travelerId}?status=${status}`
      : `${BOOKING_SERVICE_URL}/api/booking/traveler/${travelerId}`;

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching traveler bookings:', error.message);
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

const getBookingHistory = async (travelerId) => {
  try {
    // Get all accepted bookings (completed trips)
    const bookings = await getTravelerBookings(travelerId, 'accepted');
    
    // Filter for past bookings (endDate < today)
    const today = new Date();
    return bookings.filter((booking) => new Date(booking.endDate) < today);
  } catch (error) {
    console.error('Error fetching booking history:', error.message);
    throw error;
  }
};

module.exports = {
  getTravelerBookings,
  getBookingById,
  getBookingHistory,
};

