import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { body } from 'express-validator';
import { profileController } from '../controllers/profileController';
import { profileSubmissionController } from '../controllers/profileSubmissionController';
import { getCurrentUser } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { resumeUpload } from '../middlewares/resumeUpload';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile?: boolean) => void
  ) {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOC files are allowed.'));
    }
  },
});

const router = Router();

// ─── existing routes ──────────────────────────────────────────────────────────

router.post(
  '/upload-resume',
  getCurrentUser,
  upload.single('resume'),
  (req: Request, res: Response, next: NextFunction) =>
    profileController.uploadResume(req, res, next)
);

// GET /api/profile/resume/:id/parsed-data
router.get(
  '/resume/:id/parsed-data',
  getCurrentUser,
  (req: Request, res: Response, next: NextFunction) =>
    profileController.getParsedData(req, res, next)
);

router.post(
  '/analyze',
  getCurrentUser,
  [body('resumeUrl').optional().isString(), body('linkedinUrl').optional().isString()],
  validate([body('resumeUrl'), body('linkedinUrl')], 'Invalid input'),
  (req: Request, res: Response, next: NextFunction) =>
    profileController.analyze(req, res, next)
);

// ─── submission routes ────────────────────────────────────────────────────────

router.get('/submission', getCurrentUser, (req: Request, res: Response) =>
  profileSubmissionController.getSubmission(req, res)
);

router.post(
  '/submit',
  getCurrentUser,
  resumeUpload.single('resume'),
  (req: Request, res: Response) => profileSubmissionController.submit(req, res)
);

router.put(
  '/submission',
  getCurrentUser,
  resumeUpload.single('resume'),
  (req: Request, res: Response) => profileSubmissionController.updateSubmission(req, res)
);

// POST /api/profile/optimize-experience
router.post(
  '/optimize-experience',
  getCurrentUser,
  [
    body('role').isString().notEmpty(),
    body('company').isString().notEmpty(),
    body('bullets').isArray({ min: 1, max: 20 }),
  ],
  validate(
    [body('role'), body('company'), body('bullets')],
    'role, company, and bullets are required'
  ),
  (req: Request, res: Response, next: NextFunction) =>
    profileController.optimizeExperience(req, res, next)
);

export default router;
