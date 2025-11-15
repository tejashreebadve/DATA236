const { getOwnerBookings, getBookingById, updateBookingStatus } = require('../services/bookingService');
const { kafkaProducer } = require('../kafka/producer');

const getBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const bookings = await getOwnerBookings(req.user.id, status);

    res.json(bookings);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    next(error);
  }
};

const getBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await getBookingById(id);

    // Verify the booking belongs to this owner
    // Convert to string for comparison (ObjectId vs string)
    const ownerId = booking.ownerId?.toString() || booking.ownerId;
    if (ownerId !== req.user.id) {
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

const acceptBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await getBookingById(id);

    // Verify the booking belongs to this owner
    // Convert to string for comparison (ObjectId vs string)
    const ownerId = booking.ownerId?.toString() || booking.ownerId;
    if (ownerId !== req.user.id) {
      return res.status(403).json({
        error: {
          message: 'You do not have access to this booking',
          code: 'FORBIDDEN',
          status: 403,
        },
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        error: {
          message: `Booking is already ${booking.status}`,
          code: 'INVALID_STATUS',
          status: 400,
        },
      });
    }

    // Update booking status - forward JWT token for internal service call
    const token = req.headers.authorization?.replace('Bearer ', '');
    const updatedBooking = await updateBookingStatus(id, 'accepted', token);

    // Publish event to Kafka
    try {
      await kafkaProducer.send({
        topic: 'booking-status-updates',
        messages: [
          {
            key: id,
            value: JSON.stringify({
              eventType: 'BOOKING_STATUS_UPDATED',
              bookingId: id,
              propertyId: booking.propertyId.toString(),
              travelerId: booking.travelerId.toString(),
              startDate: new Date(booking.startDate).toISOString(),
              endDate: new Date(booking.endDate).toISOString(),
              oldStatus: 'pending',
              newStatus: 'accepted',
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
    } catch (kafkaError) {
      console.error('Error publishing to Kafka:', kafkaError);
      // Continue even if Kafka fails
    }

    res.json(updatedBooking);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await getBookingById(id);

    // Verify the booking belongs to this owner
    // Convert to string for comparison (ObjectId vs string)
    const ownerId = booking.ownerId?.toString() || booking.ownerId;
    if (ownerId !== req.user.id) {
      return res.status(403).json({
        error: {
          message: 'You do not have access to this booking',
          code: 'FORBIDDEN',
          status: 403,
        },
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        error: {
          message: 'Booking is already cancelled',
          code: 'ALREADY_CANCELLED',
          status: 400,
        },
      });
    }

    // Update booking status - forward JWT token for internal service call
    const token = req.headers.authorization?.replace('Bearer ', '');
    const updatedBooking = await updateBookingStatus(id, 'cancelled', token);

    // Publish event to Kafka
    try {
      await kafkaProducer.send({
        topic: 'booking-status-updates',
        messages: [
          {
            key: id,
            value: JSON.stringify({
              eventType: 'BOOKING_STATUS_UPDATED',
              bookingId: id,
              propertyId: booking.propertyId.toString(),
              travelerId: booking.travelerId.toString(),
              startDate: new Date(booking.startDate).toISOString(),
              endDate: new Date(booking.endDate).toISOString(),
              oldStatus: booking.status,
              newStatus: 'cancelled',
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
    } catch (kafkaError) {
      console.error('Error publishing to Kafka:', kafkaError);
      // Continue even if Kafka fails
    }

    res.json(updatedBooking);
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
  acceptBooking,
  cancelBooking,
};

