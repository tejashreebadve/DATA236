const mongoose = require('mongoose');

// Minimal Property schema for population
const propertySchema = new mongoose.Schema(
  {},
  { 
    collection: 'properties',
    strict: false,
    versionKey: false
  }
);

if (mongoose.models.Property) {
  module.exports = mongoose.models.Property;
} else {
  module.exports = mongoose.model('Property', propertySchema);
}

