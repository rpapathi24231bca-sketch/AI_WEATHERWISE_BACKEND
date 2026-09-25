// routes/favoriteRoutes.js
// Defines URL paths for the favourites feature. Every route here is
// protected — `protect` runs first on all of them, so req.user.id is
// always available inside the controller functions.

const express = require('express');
const router = express.Router();
const { addFavorite, getFavorites, deleteFavorite } = require('../controllers/favoriteController');
const protect = require('../middleware/authMiddleware');

// All routes below require a valid JWT.
router.use(protect);

// POST /api/favorites
router.post('/', addFavorite);

// GET /api/favorites
router.get('/', getFavorites);

// DELETE /api/favorites/:id
router.delete('/:id', deleteFavorite);

module.exports = router;
