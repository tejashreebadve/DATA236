const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
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
      immutable: true,
    },
  },
  {
    timestamps: true,
  }
);

ownerSchema.index({ email: 1 });

const Owner = mongoose.model('Owner', ownerSchema);

module.exports = Owner;

