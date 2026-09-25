// controllers/aiController.js
// Handles the HTTP side of the AI recommendation endpoint: validates
// input, orchestrates weatherService + geminiService, and shapes the
// response. It doesn't know the details of either external API — those
// stay inside their respective service files.

const weatherService = require('../services/weatherService');
const geminiService = require('../services/geminiService');

// @route   POST /api/ai/recommendation
// @desc    Get an AI-generated recommendation based on a city's real
//          current weather
// @access  Private (requires authMiddleware)
const getRecommendation = async (req, res) => {
  const { city } = req.body;

  // 1. Validate input.
  if (!city || city.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'City is required'
    });
  }

  const trimmedCity = city.trim();
  let weather;

  // 2. Get real current weather first — this is the "ground truth" that
  // will be handed to Gemini. If this fails, we never call Gemini at all.
  try {
    weather = await weatherService.getCurrentWeatherByCity(trimmedCity);
  } catch (error) {
    console.error('Weather fetch error (AI flow):', error.message);

    switch (error.type) {
      case 'CITY_NOT_FOUND':
        return res.status(404).json({
          success: false,
          message: `City not found: ${trimmedCity}`
        });
      case 'INVALID_API_KEY':
        return res.status(500).json({
          success: false,
          message: 'Weather service is not configured correctly'
        });
      case 'TIMEOUT':
        return res.status(504).json({
          success: false,
          message: 'Weather provider took too long to respond'
        });
      default:
        return res.status(502).json({
          success: false,
          message: 'Weather provider is currently unavailable'
        });
    }
  }

  // 3. Send the real weather data to Gemini and get a recommendation.
  try {
    const recommendation = await geminiService.getWeatherRecommendation(trimmedCity, weather);

    return res.status(200).json({
      success: true,
      city: weather.city,
      weather: {
        temperature: weather.temperature,
        condition: weather.condition
      },
      recommendation
    });
  } catch (error) {
    console.error('Gemini error:', error.message);

    switch (error.type) {
      case 'INVALID_API_KEY':
        return res.status(500).json({
          success: false,
          message: 'AI service is not configured correctly'
        });
      case 'TIMEOUT':
        return res.status(504).json({
          success: false,
          message: 'AI service took too long to respond'
        });
      case 'EMPTY_RESPONSE':
        return res.status(502).json({
          success: false,
          message: 'AI service returned an empty response'
        });
      case 'AI_API_ERROR':
        return res.status(502).json({
          success: false,
          message: 'AI service is currently unavailable'
        });
      default:
        return res.status(500).json({
          success: false,
          message: 'Something went wrong while generating the recommendation'
        });
    }
  }
};

module.exports = { getRecommendation };
