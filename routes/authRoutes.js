// routes/authRoutes.js

const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  getProfile
} = require('../controllers/authController');

const protect = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', registerUser);

// POST /api/auth/login
router.post('/login', loginUser);

// GET /api/auth/profile
// Protected route
router.get('/profile', protect, getProfile);

module.exports = router;