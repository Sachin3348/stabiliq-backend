const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { createAccessToken, getCurrentUser } = require('../middleware/auth');

/**
 * POST /api/auth/send-otp
 * Send OTP (bypass mode - always returns success)
 */
router.post('/send-otp', [
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty().trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: 'Email and phone are required' });
    }

    const { email, phone } = req.body;

    return res.json({
      success: true,
      message: 'OTP sent successfully (bypass mode - any OTP will work)'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP (bypass - accepts any OTP) and create/login user
 */
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty().trim(),
  body('otp').notEmpty(),
  body('name').notEmpty().trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: 'All fields are required' });
    }

    const { email, phone, otp, name, plan = 'basic' } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists - login
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        plan: user.plan,
        enrollmentDate: user.enrollmentDate,
        isActive: user.isActive
      };

      // Create JWT token
      const token = createAccessToken({
        sub: userData.email,
        id: userData.id
      });

      return res.json({
        success: true,
        token,
        user: userData
      });
    } else {
      // New user - create account
      const enrollmentDate = new Date();
      user = new User({
        email,
        name,
        phone,
        plan,
        enrollmentDate,
        createdAt: new Date(),
        isActive: true
      });

      await user.save();

      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        plan: user.plan,
        enrollmentDate: user.enrollmentDate ? user.enrollmentDate.toISOString() : null,
        isActive: user.isActive
      };

      // Create JWT token
      const token = createAccessToken({
        sub: userData.email,
        id: userData.id
      });

      return res.json({
        success: true,
        token,
        user: userData
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error (email already exists)
      return res.status(400).json({ detail: 'User with this email already exists' });
    }
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Send OTP for login (bypass mode)
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: 'Email is required' });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ detail: 'User not found. Please sign up first.' });
    }

    return res.json({
      success: true,
      message: 'OTP sent successfully (bypass mode - any OTP will work)'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user details
 */
router.get('/me', getCurrentUser, async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.sub });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        plan: user.plan,
        enrollmentDate: user.enrollmentDate,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout endpoint (client-side token removal)
 */
router.post('/logout', (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
