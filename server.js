// server.js
// Main entry point for the AI WeatherWise backend server.

// 1. Load environment variables from .env FIRST, before anything else uses them.
require('dotenv').config();

// 2. Import required packages.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// 3. Connect to MongoDB before setting up routes.
connectDB();

// 4. Create the Express application.
const app = express();

// 5. Security & parsing middleware.

// helmet sets a range of protective HTTP headers (hides X-Powered-By,
// sets sane defaults for XSS/clickjacking protection, etc).
app.use(helmet());

// CORS: only allow the configured frontend origin(s) to call this API
// from a browser, instead of allowing every website on the internet.
// CORS_ORIGIN can be a single origin or a comma-separated list, e.g.
// "http://localhost:3000,https://aiweatherwise.com". If it's not set,
// we fall back to allowing all origins ONLY outside production, so
// local development isn't broken by default.
const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : null;

const corsOptions = {
  origin: configuredOrigins || (process.env.NODE_ENV === 'production' ? false : '*')
};

app.use(cors(corsOptions));

app.use(express.json()); // Parse incoming JSON request bodies.

// 6. Routes.

// Health check route — used to confirm the server is up and running.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI WeatherWise API is running'
  });
});

// Authentication routes (register, login, profile).
app.use('/api/auth', authRoutes);

// Weather routes (current weather, and later forecast).
app.use('/api/weather', weatherRoutes);

// Favourite locations routes (all protected by authMiddleware).
app.use('/api/favorites', favoriteRoutes);

// AI recommendation routes (protected by authMiddleware).
app.use('/api/ai', aiRoutes);

// 7. Error handling — MUST be registered after all routes above.
// notFound catches any request that didn't match a route at all;
// errorHandler is the single place that formats every error response.
app.use(notFound);
app.use(errorHandler);

// 8. Get the port from environment variables, with a fallback for safety.
const PORT = process.env.PORT || 5000;

// 9. Start the server.
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
