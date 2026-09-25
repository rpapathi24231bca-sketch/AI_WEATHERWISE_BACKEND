// utils/ApiError.js
// A small custom Error class that carries an HTTP status code alongside
// the message. Throwing this from anywhere (a controller, a service)
// lets the centralized error handler know exactly what status code and
// message to send back, without needing per-route try/catch logic.

class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code to respond with
   * @param {string} message - safe, client-facing message (never put
   *                            secrets, stack traces, or raw DB/library
   *                            error text in here)
   */
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;

    // Marks this as an "expected"/"handled" error — one we deliberately
    // threw because we understood exactly what went wrong (bad input,
    // not found, external API down, etc). The global error handler uses
    // this to distinguish "safe to show this message" errors from truly
    // unexpected bugs, where showing the raw message could leak details.
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
