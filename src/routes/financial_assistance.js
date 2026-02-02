const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { getCurrentUser } = require('../middleware/auth');

/**
 * GET /api/financial-assistance/status
 * Check if financial assistance is unlocked (45 days after enrollment)
 */
router.get('/status', getCurrentUser, async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.sub });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const enrollmentDate = user.enrollmentDate;

    if (!enrollmentDate) {
      return res.json({
        isUnlocked: false,
        daysRemaining: 45,
        message: 'Enrollment date not found'
      });
    }

    const now = new Date();
    const enrollment = new Date(enrollmentDate);
    const daysSinceEnrollment = Math.floor((now - enrollment) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, 45 - daysSinceEnrollment);
    const isUnlocked = daysSinceEnrollment >= 45;

    return res.json({
      isUnlocked,
      daysRemaining,
      daysSinceEnrollment,
      enrollmentDate: enrollment.toISOString(),
      message: isUnlocked ? 'Financial assistance available' : `Available in ${daysRemaining} days`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/financial-assistance/request
 * Submit financial assistance request
 */
router.post('/request', getCurrentUser, async (req, res, next) => {
  try {
    // Check if unlocked
    const user = await User.findOne({ email: req.user.sub });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const enrollmentDate = user.enrollmentDate;
    if (!enrollmentDate) {
      return res.status(403).json({
        detail: 'Financial assistance is not yet available. Please wait 45 more days.'
      });
    }

    const now = new Date();
    const enrollment = new Date(enrollmentDate);
    const daysSinceEnrollment = Math.floor((now - enrollment) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, 45 - daysSinceEnrollment);
    const isUnlocked = daysSinceEnrollment >= 45;

    if (!isUnlocked) {
      return res.status(403).json({
        detail: `Financial assistance is not yet available. Please wait ${daysRemaining} more days.`
      });
    }

    // TODO: Store request in database
    // For now, just return success
    const requestId = `FA-${req.user.id.substring(0, 8)}-${now.toISOString().replace(/[-:T.]/g, '').substring(0, 14)}`;

    return res.json({
      success: true,
      message: 'Financial assistance request received. Our team will review and contact you soon.',
      requestId
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/financial-assistance/documents-required
 * Get list of documents required for financial assistance
 */
router.get('/documents-required', (req, res) => {
  return res.json({
    documents: [
      {
        id: 'doc-1',
        title: 'Document providing reason for job loss',
        description: 'Official termination letter or layoff notice',
        required: true
      },
      {
        id: 'doc-2',
        title: 'Employment termination letter from employer',
        description: 'Letter on company letterhead stating termination',
        required: true
      },
      {
        id: 'doc-3',
        title: 'Salary slips of last 3 months',
        description: 'Recent salary slips showing employment',
        required: true
      },
      {
        id: 'doc-4',
        title: 'Form 16',
        description: 'Latest Form 16 or tax documents',
        required: true
      },
      {
        id: 'doc-5',
        title: "Employer's contact details",
        description: 'Phone number and email of HR/Manager',
        required: true
      },
      {
        id: 'doc-6',
        title: 'Government ID Proof',
        description: 'Aadhaar card, PAN card, or Passport',
        required: true
      }
    ],
    submitEmail: 'support@stabiliq.in',
    additionalInfo: "Please compile all documents in a single PDF and email to support@stabiliq.in with subject: 'Financial Assistance Request - [Your Name]'"
  });
});

module.exports = router;
