const mongoose = require('mongoose');

// Minimal Owner schema for population
const ownerSchema = new mongoose.Schema(
  {},
  { 
    collection: 'owners',
    strict: false,
    versionKey: false
  }
);

if (mongoose.models.Owner) {
  module.exports = mongoose.models.Owner;
} else {
  module.exports = mongoose.model('Owner', ownerSchema);
}

