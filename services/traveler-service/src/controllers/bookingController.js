const { getTravelerBookings, getBookingById, getBookingHistory } = require('../services/bookingService');

/**
 * Get all bookings for a traveler
 */
const getBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const bookings = await getTravelerBookings(req.user.id, status);

    res.json(bookings);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    next(error);
  }
};

/**
 * Get booking by ID
 */
const getBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await getBookingById(id);

    // Verify the booking belongs to this traveler
    if (booking.travelerId !== req.user.id) {
      return res.status(403).json({
        error: {
          message: 'You do not have access to this booking',
          code: 'FORBIDDEN',
          status: 403,
        },
      });
    }

    res.json(booking);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    next(error);
  }
};

/**
 * Get booking history (completed trips)
 */
const getHistory = async (req, res, next) => {
  try {
    const history = await getBookingHistory(req.user.id);
    res.json(history);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    next(error);
  }
};

module.exports = {
  getBookings,
  getBooking,
  getHistory,
};

