// routes/aiRoutes.js
// Defines URL paths for AI-related endpoints. Protected by authMiddleware
// since a JWT is required per the spec.

const express = require('express');
const router = express.Router();
const { getRecommendation } = require('../controllers/aiController');
const protect = require('../middleware/authMiddleware');

// POST /api/ai/recommendation
router.post('/recommendation', protect, getRecommendation);

module.exports = router;
