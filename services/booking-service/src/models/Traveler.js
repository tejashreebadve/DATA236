const mongoose = require('mongoose');

// Minimal Traveler schema for population
// Must match the actual Traveler collection structure
// Using strict: false to allow all fields from the actual collection
const travelerSchema = new mongoose.Schema(
  {},
  { 
    collection: 'travelers',
    strict: false, // Allow all fields from the actual collection
    versionKey: false // Don't include __v
  }
);

// Ensure we don't create duplicate models
if (mongoose.models.Traveler) {
  module.exports = mongoose.models.Traveler;
} else {
  module.exports = mongoose.model('Traveler', travelerSchema);
}

