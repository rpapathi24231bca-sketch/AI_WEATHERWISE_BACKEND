// services/weatherService.js

const axios = require('axios');

const CURRENT_WEATHER_URL =
  'https://api.openweathermap.org/data/2.5/weather';

const FORECAST_URL =
  'https://api.openweathermap.org/data/2.5/forecast';

const REQUEST_TIMEOUT_MS = 8000;

/**
 * Fetch current weather for a city.
 */
const getCurrentWeatherByCity = async (city) => {
  if (!process.env.WEATHER_API_KEY) {
    const err = new Error('WEATHER_API_KEY is not configured');
    err.type = 'INVALID_API_KEY';
    throw err;
  }

  let response;

  try {
    response = await axios.get(CURRENT_WEATHER_URL, {
      params: {
        q: city,
        appid: process.env.WEATHER_API_KEY,
        units: 'metric'
      },
      timeout: REQUEST_TIMEOUT_MS
    });
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      const err = new Error('Weather provider request timed out');
      err.type = 'TIMEOUT';
      throw err;
    }

    if (error.response) {
      const status = error.response.status;

      if (status === 404) {
        const err = new Error(`City "${city}" not found`);
        err.type = 'CITY_NOT_FOUND';
        throw err;
      }

      if (status === 401) {
        const err = new Error('Weather provider rejected the API key');
        err.type = 'INVALID_API_KEY';
        throw err;
      }

      const err = new Error(
        `Weather provider returned status ${status}`
      );
      err.type = 'EXTERNAL_API_ERROR';
      throw err;
    }

    const err = new Error(
      'Could not reach the weather provider'
    );
    err.type = 'EXTERNAL_API_ERROR';
    throw err;
  }

  return formatWeatherResponse(response.data, city);
};

/**
 * Fetch 5-day forecast for a city.
 *
 * OpenWeather returns forecast data in 3-hour intervals.
 */
const getForecastByCity = async (city) => {
  if (!process.env.WEATHER_API_KEY) {
    const err = new Error('WEATHER_API_KEY is not configured');
    err.type = 'INVALID_API_KEY';
    throw err;
  }

  let response;

  try {
    response = await axios.get(FORECAST_URL, {
      params: {
        q: city,
        appid: process.env.WEATHER_API_KEY,
        units: 'metric'
      },
      timeout: REQUEST_TIMEOUT_MS
    });
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      const err = new Error('Weather forecast request timed out');
      err.type = 'TIMEOUT';
      throw err;
    }

    if (error.response) {
      const status = error.response.status;

      if (status === 404) {
        const err = new Error(`City "${city}" not found`);
        err.type = 'CITY_NOT_FOUND';
        throw err;
      }

      if (status === 401) {
        const err = new Error(
          'Weather provider rejected the API key'
        );
        err.type = 'INVALID_API_KEY';
        throw err;
      }

      const err = new Error(
        `Weather provider returned status ${status}`
      );
      err.type = 'EXTERNAL_API_ERROR';
      throw err;
    }

    const err = new Error(
      'Could not reach the weather provider'
    );
    err.type = 'EXTERNAL_API_ERROR';
    throw err;
  }

  return formatForecastResponse(response.data, city);
};

/**
 * Format current weather response.
 */
const formatWeatherResponse = (raw, requestedCity) => {
  const weatherEntry = Array.isArray(raw.weather)
    ? raw.weather[0]
    : null;

  if (!raw || !raw.main || !weatherEntry || !raw.coord) {
    const err = new Error(
      'Weather provider returned an unexpected response shape'
    );
    err.type = 'UNEXPECTED_RESPONSE';
    throw err;
  }

  return {
    city: raw.name || requestedCity,
    country: raw.sys?.country || 'Unknown',
    temperature: Math.round(raw.main.temp),
    feelsLike: Math.round(raw.main.feels_like),
    humidity: raw.main.humidity,
    pressure: raw.main.pressure,
    windSpeed: raw.wind?.speed ?? null,
    condition: weatherEntry.main,
    description: weatherEntry.description,
    latitude: raw.coord.lat,
    longitude: raw.coord.lon
  };
};

/**
 * Format 5-day forecast response.
 */
const formatForecastResponse = (raw, requestedCity) => {
  if (!raw || !Array.isArray(raw.list)) {
    const err = new Error(
      'Weather provider returned an unexpected forecast response'
    );
    err.type = 'UNEXPECTED_RESPONSE';
    throw err;
  }

  const cityName =
    raw.city?.name || requestedCity;

  const country =
    raw.city?.country || 'Unknown';

  const forecast = raw.list.map((item) => {
    const weatherEntry = Array.isArray(item.weather)
      ? item.weather[0]
      : null;

    return {
      dateTime: item.dt_txt,
      temperature: Math.round(item.main.temp),
      feelsLike: Math.round(item.main.feels_like),
      humidity: item.main.humidity,
      pressure: item.main.pressure,
      windSpeed: item.wind?.speed ?? null,
      condition: weatherEntry?.main || 'Unknown',
      description: weatherEntry?.description || '',
      rainProbability: Math.round((item.pop || 0) * 100)
    };
  });

  return {
    city: cityName,
    country,
    forecast
  };
};

module.exports = {
  getCurrentWeatherByCity,
  getForecastByCity
};