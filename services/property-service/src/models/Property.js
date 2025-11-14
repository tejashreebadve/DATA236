const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Owner ID is required'],
      ref: 'Owner',
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Property name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Property type is required'],
      enum: ['Apartment', 'House', 'Villa', 'Condo', 'Townhouse', 'Studio'],
      default: 'Apartment',
    },
    location: {
      address: {
        type: String,
        required: [true, 'Address is required'],
      },
      city: {
        type: String,
        required: [true, 'City is required'],
      },
      state: {
        type: String,
        required: [true, 'State is required'],
        uppercase: true,
        maxlength: 2,
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
      },
      coordinates: {
        lat: {
          type: Number,
          default: null,
        },
        lng: {
          type: Number,
          default: null,
        },
      },
    },
    description: {
      type: String,
      default: '',
    },
    photos: {
      type: [String],
      default: [],
    },
    pricing: {
      basePrice: {
        type: Number,
        required: [true, 'Base price is required'],
        min: [0, 'Price must be positive'],
      },
      currency: {
        type: String,
        default: 'USD',
        uppercase: true,
      },
    },
    amenities: {
      type: [String],
      default: [],
    },
    bedrooms: {
      type: Number,
      required: [true, 'Number of bedrooms is required'],
      min: [0, 'Bedrooms must be non-negative'],
    },
    bathrooms: {
      type: Number,
      required: [true, 'Number of bathrooms is required'],
      min: [0, 'Bathrooms must be non-negative'],
    },
    maxGuests: {
      type: Number,
      required: [true, 'Maximum guests is required'],
      min: [1, 'Maximum guests must be at least 1'],
    },
    availability: {
      startDate: {
        type: Date,
        default: null,
      },
      endDate: {
        type: Date,
        default: null,
      },
      blockedDates: [
        {
          startDate: {
            type: Date,
            required: true,
          },
          endDate: {
            type: Date,
            required: true,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search performance
propertySchema.index({ 'location.city': 1 });
propertySchema.index({ 'location.country': 1 });
propertySchema.index({ ownerId: 1 });
propertySchema.index({ type: 1 });
propertySchema.index({ 'pricing.basePrice': 1 });
propertySchema.index({ maxGuests: 1 });
propertySchema.index({ 'location.coordinates': '2dsphere' }); // For geospatial queries

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;

