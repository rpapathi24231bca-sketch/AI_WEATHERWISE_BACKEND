// controllers/authController.js
// Contains the logic for authentication-related routes.
// Keeping this separate from routes/authRoutes.js means the routes file
// only deals with "which URL maps to which function", while this file
// deals with "what actually happens" for each request.

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// A simple regex to catch obviously invalid emails, e.g. "notanemail".
// It's not perfect (no regex fully validates email), but it's enough
// to reject clearly malformed input.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// @route   POST /api/auth/register
// @desc    Register a new user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate name.
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // 2. Validate email.
    if (!email || email.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // 3. Validate password.
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Normalize the email the same way the schema does (lowercase, trimmed),
    // so the duplicate check below is accurate.
    const normalizedEmail = email.trim().toLowerCase();

    // 4. Check if email already exists.
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // 5. Hash the password using bcrypt.
    // "10" is the salt round count — a higher number is more secure but slower.
    // 10 is a widely used, sensible default for this kind of app.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6 & 7. Create the user and save it to MongoDB.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    // 8 & 10. Return a clean response that never includes the password.
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    // Catches unexpected problems, e.g. MongoDB being unreachable,
    // or a validation error slipping past our manual checks above.
    console.error('Register error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while registering the user'
    });
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate a user and return a JWT
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate email.
    if (!email || email.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // 2. Validate password.
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 3. Find the user by email.
    // The schema sets `password: { select: false }`, so it's excluded
    // from queries by default — we have to explicitly ask for it here
    // in order to compare it below.
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 4. Compare the submitted password against the stored hash.
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // 5 & 6. Generate the JWT. Wrapped separately so a missing/misconfigured
    // JWT_SECRET produces a clear 500 instead of an unhandled throw.
    let token;
    try {
      token = generateToken(user._id);
    } catch (err) {
      console.error('JWT configuration error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Server authentication configuration error'
      });
    }

    // 7 & 8. Return the token and safe user info — never the password.
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    // Catches unexpected problems, e.g. MongoDB being unreachable.
    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while logging in'
    });
  }
};

// @route   GET /api/auth/profile
// @desc    Return the currently authenticated user's info
// @access  Private (requires authMiddleware)
const getProfile = async (req, res) => {
  try {
    // req.user was attached by authMiddleware after verifying the JWT.
    // This route exists mainly as a simple test that the middleware works.
    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id
      }
    });
  } catch (error) {
    console.error('Profile error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching the profile'
    });
  }
};

module.exports = { registerUser, loginUser, getProfile };
