const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    location: {
      type: String,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    role: {
      type: String,
      default: 'owner',
    },
  },
  {
    timestamps: true,
  }
);

// Only register if not already registered
const Owner = mongoose.models.Owner || mongoose.model('Owner', ownerSchema);

module.exports = Owner;

