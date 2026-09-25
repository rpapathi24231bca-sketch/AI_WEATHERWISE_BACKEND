// utils/asyncHandler.js
// Wraps an async route/controller function so that any error it throws
// (or any promise it rejects) is automatically passed to next(error)
// instead of crashing the process or requiring a try/catch in every
// single controller. This is what makes centralized error handling work.

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
