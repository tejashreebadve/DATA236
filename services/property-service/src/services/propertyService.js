const Property = require('../models/Property');

/**
 * Check if property is available for given dates
 */
const checkAvailability = (property, startDate, endDate) => {
  // Check if property has availability dates set
  if (property.availability.startDate && property.availability.endDate) {
    const availStart = new Date(property.availability.startDate);
    const availEnd = new Date(property.availability.endDate);
    const reqStart = new Date(startDate);
    const reqEnd = new Date(endDate);

    // Check if requested dates are within availability window
    if (reqStart < availStart || reqEnd > availEnd) {
      return false;
    }
  }

  // Check blocked dates
  if (property.availability.blockedDates && property.availability.blockedDates.length > 0) {
    const reqStart = new Date(startDate);
    const reqEnd = new Date(endDate);

    for (const block of property.availability.blockedDates) {
      const blockStart = new Date(block.startDate);
      const blockEnd = new Date(block.endDate);

      // Check if there's any overlap
      if (reqStart <= blockEnd && reqEnd >= blockStart) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Block dates for a property (when booking is accepted)
 */
const blockDates = async (propertyId, startDate, endDate) => {
  const property = await Property.findById(propertyId);
  if (!property) {
    throw new Error('Property not found');
  }

  property.availability.blockedDates.push({
    startDate: new Date(startDate),
    endDate: new Date(endDate),
  });

  await property.save();
  return property;
};

/**
 * Unblock dates for a property (when booking is cancelled)
 */
const unblockDates = async (propertyId, startDate, endDate) => {
  const property = await Property.findById(propertyId);
  if (!property) {
    throw new Error('Property not found');
  }

  const reqStart = new Date(startDate);
  const reqEnd = new Date(endDate);

  property.availability.blockedDates = property.availability.blockedDates.filter(
    (block) => {
      const blockStart = new Date(block.startDate);
      const blockEnd = new Date(block.endDate);

      // Remove blocks that match the dates
      return !(blockStart.getTime() === reqStart.getTime() && blockEnd.getTime() === reqEnd.getTime());
    }
  );

  await property.save();
  return property;
};

module.exports = {
  checkAvailability,
  blockDates,
  unblockDates,
};

