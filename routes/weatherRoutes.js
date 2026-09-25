// routes/weatherRoutes.js

// Defines URL paths for weather-related endpoints
// and connects them to controller functions.

const express = require('express');

const router = express.Router();

const {
  getCurrentWeather,
  getForecast
} = require('../controllers/weatherController');

// GET /api/weather/current?city=Chennai
// Public current-weather lookup.
router.get('/current', getCurrentWeather);

// GET /api/weather/forecast?city=Chennai
// Public 5-day forecast lookup.
router.get('/forecast', getForecast);

module.exports = router;