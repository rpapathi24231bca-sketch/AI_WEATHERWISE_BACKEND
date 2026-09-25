// middleware/authMiddleware.js
// Protects routes by requiring a valid JWT in the Authorization header.
// On success, attaches the decoded user info to req.user and calls next()
// so the request continues into the actual route handler.

const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  // 1. Read the Authorization header.
  const authHeader = req.headers.authorization;

  // 2 & 3. Expect "Authorization: Bearer <token>" and extract the token.
  // If the header is missing entirely, or doesn't start with "Bearer ",
  // there's no token to work with.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const token = authHeader.split(' ')[1];

  // If "Bearer " was present but nothing followed it (e.g. "Bearer "
  // with trailing space and no token), treat it the same as missing.
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  try {
    // 4. Verify the token using JWT_SECRET.
    // jwt.verify() throws if the token is malformed, has an invalid
    // signature, or has expired — all handled by the catch block below.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5 & 6. Read the user ID from the decoded payload and attach it
    // to req.user so downstream route handlers can access it.
    req.user = { id: decoded.id };

    // 7. Allow the request to continue.
    next();
  } catch (error) {
    // Covers invalid signature, malformed token, and expired token
    // (jwt.verify throws TokenExpiredError, JsonWebTokenError, etc.
    // for all of these) — we return one consistent message either way
    // so we don't leak details about why verification failed.
    console.error('JWT verification error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = protect;
