// models/Favorite.js
// Defines the shape of a "Favorite" document — a saved city location
// belonging to one specific user.

const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',           // Lets us populate the owning user later if needed.
      required: [true, 'userId is required'],
      index: true            // Speeds up "get all favorites for this user" queries.
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required']
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required']
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // Only createdAt is needed here.
  }
);

// Prevent the same user from saving the exact same city twice.
// This is a compound unique index: the combination of (userId, city)
// must be unique, but the same city CAN appear once per different user.
favoriteSchema.index({ userId: 1, city: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;
