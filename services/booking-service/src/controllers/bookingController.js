const Booking = require('../models/Booking');
const { getPropertyById, checkAvailability } = require('../services/propertyService');
const { kafkaProducer } = require('../kafka/producer');

/**
 * Create booking request
 */
const createBooking = async (req, res, next) => {
  try {
    const { propertyId, startDate, endDate, guests, totalPrice } = req.body;
    const travelerId = req.user.id;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res.status(400).json({
        error: {
          message: 'End date must be after start date',
          code: 'INVALID_DATES',
          status: 400,
        },
      });
    }

    // Get property details
    let property;
    try {
      property = await getPropertyById(propertyId);
    } catch (error) {
      return res.status(404).json({
        error: {
          message: 'Property not found',
          code: 'PROPERTY_NOT_FOUND',
          status: 404,
        },
      });
    }

    // Check availability
    const available = await checkAvailability(propertyId, startDate, endDate);
    if (!available) {
      return res.status(400).json({
        error: {
          message: 'Property is not available for the selected dates',
          code: 'NOT_AVAILABLE',
          status: 400,
        },
      });
    }

    // Check guests limit
    if (guests > property.maxGuests) {
      return res.status(400).json({
        error: {
          message: `Maximum ${property.maxGuests} guests allowed`,
          code: 'EXCEEDS_GUEST_LIMIT',
          status: 400,
        },
      });
    }

    // Create booking
    const booking = await Booking.create({
      propertyId,
      travelerId,
      ownerId: property.ownerId,
      startDate,
      endDate,
      guests,
      totalPrice,
      status: 'pending',
    });

    // Publish event to Kafka
    try {
      await kafkaProducer.send({
        topic: 'booking-requests',
        messages: [
          {
            key: booking._id.toString(),
            value: JSON.stringify({
              eventType: 'BOOKING_CREATED',
              bookingId: booking._id.toString(),
              propertyId: booking.propertyId.toString(),
              ownerId: booking.ownerId.toString(),
              travelerId: booking.travelerId.toString(),
              startDate: booking.startDate.toISOString(),
              endDate: booking.endDate.toISOString(),
              status: booking.status,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
    } catch (kafkaError) {
      console.error('Error publishing to Kafka:', kafkaError);
      // Continue even if Kafka fails
    }

    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};

/**
 * Get booking by ID
 */
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        error: {
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND',
          status: 404,
        },
      });
    }

    res.json(booking);
  } catch (error) {
    next(error);
  }
};

/**
 * Get bookings by traveler
 */
const getTravelerBookings = async (req, res, next) => {
  try {
    const { travelerId } = req.params;
    const { status } = req.query;

    const query = { travelerId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('propertyId', 'name photos location pricing')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

/**
 * Get bookings by owner
 */
const getOwnerBookings = async (req, res, next) => {
  try {
    const { ownerId } = req.params;
    const { status } = req.query;

    const query = { ownerId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate({
        path: 'travelerId',
        select: 'name email',
        model: 'Traveler',
        strictPopulate: false // Allow population even if model doesn't match exactly
      })
      .populate({
        path: 'propertyId',
        select: 'name photos location pricing',
        model: 'Property',
        strictPopulate: false // Allow population even if model doesn't match exactly
      })
      .lean() // Convert to plain JavaScript objects for better JSON serialization
      .sort({ createdAt: -1 });
    
    // Debug: Log first booking to check populate
    if (bookings.length > 0) {
      console.log(`📊 Status: ${status || 'all'}, First booking travelerId:`, JSON.stringify(bookings[0].travelerId, null, 2));
      console.log(`📊 Status: ${status || 'all'}, First booking propertyId:`, JSON.stringify(bookings[0].propertyId, null, 2));
      
      // Special debug for cancelled bookings
      if (status === 'cancelled' || bookings[0].status === 'cancelled') {
        console.log('🔴 CANCELLED BOOKING DEBUG:');
        console.log('  - travelerId type:', typeof bookings[0].travelerId);
        console.log('  - travelerId value:', bookings[0].travelerId);
        console.log('  - propertyId type:', typeof bookings[0].propertyId);
        console.log('  - propertyId value:', bookings[0].propertyId);
        console.log('  - Full booking:', JSON.stringify(bookings[0], null, 2));
      }
    }
    
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

/**
 * Update booking status (internal use, typically via Kafka)
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'accepted', 'cancelled'].includes(status)) {
      return res.status(400).json({
        error: {
          message: 'Invalid status',
          code: 'INVALID_STATUS',
          status: 400,
        },
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        error: {
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND',
          status: 404,
        },
      });
    }

    res.json(booking);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookingById,
  getTravelerBookings,
  getOwnerBookings,
  updateBookingStatus,
};

