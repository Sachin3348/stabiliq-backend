const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { getCurrentUser } = require('../middleware/auth');

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for current user
 */
router.get('/stats', getCurrentUser, async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.sub });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Calculate days since enrollment
    const enrollmentDate = user.enrollmentDate;
    let daysSinceEnrollment = 0;
    let daysUntilFinancial = 45;

    if (enrollmentDate) {
      const now = new Date();
      const enrollment = new Date(enrollmentDate);
      daysSinceEnrollment = Math.floor((now - enrollment) / (1000 * 60 * 60 * 24));
      daysUntilFinancial = Math.max(0, 45 - daysSinceEnrollment);
    }

    return res.json({
      coursesCompleted: 0, // TODO: Track course progress
      daysUntilFinancialAssistance: daysUntilFinancial,
      planType: user.plan || 'basic',
      enrollmentDate: enrollmentDate ? new Date(enrollmentDate).toISOString() : null,
      daysSinceEnrollment: daysSinceEnrollment
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
