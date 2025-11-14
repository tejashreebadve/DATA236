const { getOwnerBookings, getOwnerProperties } = require('../services/bookingService');

const getDashboard = async (req, res, next) => {
  try {
    const ownerId = req.user.id;

    // Get all bookings
    const allBookings = await getOwnerBookings(ownerId);
    const pendingRequests = allBookings.filter((b) => b.status === 'pending');
    const recentBookings = allBookings
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    // Get properties
    const properties = await getOwnerProperties(ownerId);

    // Calculate stats
    const stats = {
      totalProperties: properties.length,
      totalBookings: allBookings.length,
      pendingRequests: pendingRequests.length,
      acceptedBookings: allBookings.filter((b) => b.status === 'accepted').length,
      totalRevenue: allBookings
        .filter((b) => b.status === 'accepted')
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0),
    };

    res.json({
      stats,
      recentBookings,
      pendingRequests,
    });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    next(error);
  }
};

module.exports = {
  getDashboard,
};

