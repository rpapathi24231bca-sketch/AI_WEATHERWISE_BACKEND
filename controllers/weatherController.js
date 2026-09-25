const asyncHandler = require('../utils/asyncHandler');
const {
  getCurrentWeatherByCity,
  getForecastByCity
} = require('../services/weatherService');

/**
 * GET /api/weather/current?city=Chennai
 */
const getCurrentWeather = asyncHandler(async (req, res) => {
  const { city } = req.query;

  if (!city || !city.trim()) {
    return res.status(400).json({
      success: false,
      message: 'City name is required'
    });
  }

  const weather = await getCurrentWeatherByCity(city.trim());

  res.status(200).json({
    success: true,
    data: weather
  });
});

/**
 * GET /api/weather/forecast?city=Chennai
 */
const getForecast = asyncHandler(async (req, res) => {
  const { city } = req.query;

  if (!city || !city.trim()) {
    return res.status(400).json({
      success: false,
      message: 'City name is required'
    });
  }

  const forecast = await getForecastByCity(city.trim());

  res.status(200).json({
    success: true,
    data: forecast
  });
});

module.exports = {
  getCurrentWeather,
  getForecast
};