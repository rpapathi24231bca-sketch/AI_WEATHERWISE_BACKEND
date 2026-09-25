// services/geminiService.js

const { GoogleGenAI } = require('@google/genai');

const MODEL_NAME = 'gemini-3.6-flash';
const REQUEST_TIMEOUT_MS = 45000;

const buildPrompt = (city, weather) => {
  return `You are a weather assistant for the AI WeatherWise app.

Use ONLY this current weather data:

City: ${weather.city}, ${weather.country}
Temperature: ${weather.temperature}°C
Feels like: ${weather.feelsLike}°C
Humidity: ${weather.humidity}%
Pressure: ${weather.pressure} hPa
Wind speed: ${weather.windSpeed} m/s
Condition: ${weather.condition}
Description: ${weather.description}

Give a short and practical recommendation for someone in ${city}.

Include:
1. Weather Summary
2. Clothing Advice
3. Outdoor Activity Advice
4. Travel Advice
5. Umbrella / Rain Advice
6. General Safety Advice

Do not invent weather information.
Do not contradict the provided weather data.
Keep the response concise.`;
};

const getWeatherRecommendation = async (city, weather) => {
  if (!process.env.GEMINI_API_KEY) {
    const err = new Error('GEMINI_API_KEY is not configured');
    err.type = 'INVALID_API_KEY';
    throw err;
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  const prompt = buildPrompt(city, weather);

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      const err = new Error('Gemini API request timed out');
      err.type = 'TIMEOUT';
      reject(err);
    }, REQUEST_TIMEOUT_MS);
  });

  let response;

  try {
    response = await Promise.race([
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingLevel: 'minimal'
          },
          maxOutputTokens: 500
        }
      }),
      timeoutPromise
    ]);
  } catch (error) {
    if (error.type) {
      throw error;
    }

    const message = error.message || '';
    const status = error.status || error.code;

    if (
      status === 401 ||
      status === 403 ||
      /API key/i.test(message)
    ) {
      const err = new Error('Gemini API rejected the API key');
      err.type = 'INVALID_API_KEY';
      throw err;
    }

    const err = new Error(
      `Gemini API request failed: ${message}`
    );

    err.type = 'AI_API_ERROR';

    throw err;
  }

  const text = response?.text;

  if (!text || text.trim().length === 0) {
    const err = new Error('Gemini returned an empty response');
    err.type = 'EMPTY_RESPONSE';
    throw err;
  }

  return text.trim();
};

module.exports = {
  getWeatherRecommendation
};