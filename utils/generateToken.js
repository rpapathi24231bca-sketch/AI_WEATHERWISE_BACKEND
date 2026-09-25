// utils/generateToken.js
// Small helper responsible for one thing: creating a signed JWT for a user.
// Keeping this separate from authController.js means the controller
// doesn't need to know the details of how tokens are signed.

const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT containing the user's ID.
 * @param {string} userId - MongoDB _id of the user
 * @returns {string} signed JWT, valid for 7 days
 */
const generateToken = (userId) => {
  // Fail loudly if JWT_SECRET isn't configured — better to catch this
  // in the controller and return a clean 500 than let jwt.sign() throw
  // something less obvious.
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = generateToken;
