const mongoose = require('mongoose');

const travelerSchema = new mongoose.Schema(
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
    about: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: '',
      uppercase: true,
      maxlength: 2,
    },
    languages: {
      type: [String],
      default: [],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
      default: 'Prefer not to say',
    },
    role: {
      type: String,
      default: 'traveler',
      immutable: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
travelerSchema.index({ email: 1 });

const Traveler = mongoose.model('Traveler', travelerSchema);

module.exports = Traveler;

