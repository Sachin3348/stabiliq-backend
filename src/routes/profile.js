const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { getCurrentUser } = require('../middleware/auth');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory for now (TODO: implement file storage)
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF and DOC files
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOC files are allowed.'), false);
    }
  }
});

/**
 * POST /api/profile/upload-resume
 * Upload resume file (PDF/DOC)
 */
router.post('/upload-resume', getCurrentUser, upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded' });
    }

    // TODO: Implement actual file storage
    // For now, return mock URL
    return res.json({
      success: true,
      fileUrl: `/uploads/resumes/${req.user.id}/${req.file.originalname}`,
      filename: req.file.originalname
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/profile/analyze
 * Analyze resume and LinkedIn profile - returns mock analysis
 */
router.post('/analyze',
  getCurrentUser,
  [
    body('resumeUrl').optional().isString(),
    body('linkedinUrl').optional().isString()
  ],
  async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: 'Invalid input' });
    }

    const { resumeUrl, linkedinUrl } = req.body;

    if (!resumeUrl && !linkedinUrl) {
      return res.status(400).json({ detail: 'At least one of resume or LinkedIn URL is required' });
    }

    // Mock analysis output (matching Python backend)
    const mockAnalysis = {
      resumeScore: Math.floor(Math.random() * (90 - 60 + 1)) + 60,
      aiReadiness: Math.floor(Math.random() * (85 - 55 + 1)) + 55,
      skillGaps: [
        'Python Programming',
        'Machine Learning Fundamentals',
        'Data Analysis & Visualization',
        'Cloud Computing (AWS/Azure)',
        'Project Management Tools'
      ],
      strengths: [
        'Strong communication skills evident in descriptions',
        'Consistent work history with progressive responsibilities',
        'Good mix of technical and soft skills',
        'Clear achievement statements with quantifiable results'
      ],
      careerSuggestions: [
        'Consider adding specific AI/ML projects to demonstrate hands-on experience',
        'Quantify more achievements with metrics (e.g., "30% increase in efficiency")',
        'Optimize LinkedIn headline to include target role keywords',
        'Add relevant certifications (e.g., AWS, Google Cloud, Coursera AI courses)',
        'Improve resume formatting for better ATS compatibility',
        'Network with professionals in your target industry',
        'Update skills section with current in-demand technologies'
      ],
      keywordOptimization: {
        missingKeywords: ['AI', 'Machine Learning', 'Data Science', 'Python', 'SQL'],
        presentKeywords: ['Project Management', 'Team Leadership', 'Communication'],
        recommendation: 'Add more technical keywords relevant to AI-driven roles'
      },
      linkedinOptimization: {
        profileCompleteness: Math.floor(Math.random() * (95 - 70 + 1)) + 70,
        recommendations: [
          'Add a professional profile photo if missing',
          'Write a compelling headline (beyond job title)',
          'Expand "About" section with career story',
          'Request recommendations from colleagues',
          'Share industry-relevant content regularly'
        ]
      },
      analyzedAt: new Date().toISOString()
    };

    return res.json({
      success: true,
      analysis: mockAnalysis
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
