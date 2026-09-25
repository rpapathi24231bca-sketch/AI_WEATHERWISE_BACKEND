// middleware/errorMiddleware.js
// The single place in the whole backend that decides what status code
// and message get sent back for ANY error — thrown from a controller,
// a service, or Mongoose itself. Every route ultimately funnels its
// errors here via asyncHandler's next(error).
//
// Mount `notFound` after all routes, and `errorHandler` last of all,
// in server.js.

const ApiError = require('../utils/ApiError');

// Catches requests to routes that don't exist at all (e.g. a typo'd
// URL). Without this, Express would fall through to its own default
// HTML 404 page instead of our JSON error format.
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`);
  next(error);
};

// The final error handler. Must be registered AFTER all other
// app.use()/routes, and must keep all four arguments (err, req, res, next)
// — that four-argument signature is what tells Express this is an
// error-handling middleware rather than a normal one.
const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  // --- Recognize common Mongoose/library errors and translate them into
  // clean, safe, consistent responses, so individual controllers never
  // need to know about Mongoose error internals. ---

  // Invalid MongoDB ObjectId (e.g. a malformed :id in a URL param).
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // Mongoose schema validation failed (required field missing, etc).
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Duplicate key violation (e.g. the unique userId+city index on Favorite).
  if (err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyValue || {}).join(', ') || 'value';
    message = `Duplicate ${duplicateField} — this already exists`;
  }

  // Malformed or invalid JSON sent in the request body (from express.json()).
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON in request body';
  }

  // JWT errors, in case anything besides authMiddleware ever calls
  // jwt.verify() without its own try/catch (defense in depth).
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // --- Never leak internals. ---
  // For a genuinely unexpected error (not one we deliberately threw as
  // an ApiError, and not one of the recognized cases above), don't send
  // the raw error message to the client in production — it might contain
  // a file path, a raw DB error string, or other internal detail.
  const isRecognized = err.isOperational || statusCode !== 500;

  // Always log the full error server-side, regardless of environment —
  // this is what you'll actually look at to debug, and it never reaches
  // the client.
  console.error(`[${statusCode}] ${err.name || 'Error'}:`, err.message);
  if (!isProduction && err.stack) {
    console.error(err.stack);
  }

  if (statusCode === 500 && !isRecognized && isProduction) {
    message = 'Something went wrong on the server';
  }

  const response = {
    success: false,
    message
  };

  // Stack traces are only ever included outside production, and never
  // sent to the client in production under any circumstance.
  if (!isProduction && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = { notFound, errorHandler };
