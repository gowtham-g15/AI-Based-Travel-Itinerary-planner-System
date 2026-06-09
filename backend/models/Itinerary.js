const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  destination: {
    type: String,
    required: true,
    default: 'Coimbatore'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  numberOfTravelers: {
    type: Number,
    required: true,
    min: 1
  },
  budget: {
    type: String,
    required: true
  },
  tripPlan: {
    trip_duration: {
      type: Number,
      required: true
    },
    preferences: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    daily_plans: [{
      day: {
        type: Number,
        required: true
      },
      places: [{
        name: String,
        category: String,
        description: String,
        address: String,
        area: String,
        latitude: Number,
        longitude: Number,
        openingHours: String,
        entryFee: String,
        bestTimeToVisit: String,
        duration: String,
        amenities: [String],
        rating: String,
        tags: String,
        score: Number
      }],
      restaurants: [{
        name: String,
        cuisine: String,
        description: String,
        address: String,
        area: String,
        latitude: Number,
        longitude: Number,
        openingHours: String,
        priceRange: String,
        specialties: String,
        rating: String,
        tags: String,
        score: Number
      }]
    }],
    summary: {
      total_places: Number,
      total_restaurants: Number
    }
  },
  preferences: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
itinerarySchema.index({ userId: 1 });
itinerarySchema.index({ createdAt: -1 });
itinerarySchema.index({ startDate: 1 });

module.exports = mongoose.model('Itinerary', itinerarySchema);
