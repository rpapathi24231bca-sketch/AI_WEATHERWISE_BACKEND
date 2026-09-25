// controllers/favoriteController.js
// Contains the logic for creating, listing, and deleting a user's
// favourite locations. Every function here assumes authMiddleware has
// already run and attached `req.user.id` — that's what makes it safe
// to trust `req.user.id` as "the currently logged-in user".

const mongoose = require('mongoose');
const Favorite = require('../models/Favorite');

// @route   POST /api/favorites
// @desc    Save a new favourite location for the logged-in user
// @access  Private
const addFavorite = async (req, res) => {
  try {
    const { city, country, latitude, longitude } = req.body;

    // 1. Validate required fields.
    if (!city || city.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'City is required'
      });
    }

    if (!country || country.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Country is required'
      });
    }

    if (latitude === undefined || latitude === null || isNaN(latitude)) {
      return res.status(400).json({
        success: false,
        message: 'A valid latitude is required'
      });
    }

    if (longitude === undefined || longitude === null || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'A valid longitude is required'
      });
    }

    // 2. Create the favourite, tied to the logged-in user's ID.
    // req.user.id comes from authMiddleware — never from the request body,
    // so a user can never create a favourite "as" someone else.
    const favorite = await Favorite.create({
      userId: req.user.id,
      city: city.trim(),
      country: country.trim(),
      latitude,
      longitude
    });

    return res.status(201).json({
      success: true,
      message: 'Favorite added successfully',
      data: favorite
    });
  } catch (error) {
    // MongoDB error code 11000 = duplicate key, triggered by our
    // unique (userId, city) index in the Favorite model.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This city is already in your favorites'
      });
    }

    console.error('Add favorite error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while adding the favorite'
    });
  }
};

// @route   GET /api/favorites
// @desc    Get all favourite locations for the logged-in user
// @access  Private
const getFavorites = async (req, res) => {
  try {
    // Filtering by userId is what guarantees a user only ever sees
    // their own favorites — there is no way to pass a different
    // userId in through this endpoint.
    const favorites = await Favorite.find({ userId: req.user.id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: favorites.length,
      data: favorites
    });
  } catch (error) {
    console.error('Get favorites error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching favorites'
    });
  }
};

// @route   DELETE /api/favorites/:id
// @desc    Delete one of the logged-in user's favourite locations
// @access  Private
const deleteFavorite = async (req, res) => {
  try {
    const { id } = req.params;

    // Guard against a malformed ID (not a valid MongoDB ObjectId) before
    // even hitting the database, so we return a clean 400 instead of
    // letting Mongoose throw a CastError.
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid favorite ID'
      });
    }

    const favorite = await Favorite.findById(id);

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    // SECURITY: confirm the favorite actually belongs to the logged-in
    // user before deleting it. Without this check, any authenticated
    // user could delete any favorite by guessing/enumerating IDs.
    if (favorite.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to delete this favorite'
      });
    }

    await favorite.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Favorite deleted successfully'
    });
  } catch (error) {
    console.error('Delete favorite error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while deleting the favorite'
    });
  }
};

module.exports = { addFavorite, getFavorites, deleteFavorite };
