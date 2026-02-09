import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { body } from 'express-validator';
import { profileController } from '../controllers/profileController';
import { getCurrentUser } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

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

router.post(
  '/upload-resume',
  getCurrentUser,
  upload.single('file'),
  (req: Request, res: Response, next: NextFunction) =>
    profileController.uploadResume(req, res, next)
);

router.post(
  '/analyze',
  getCurrentUser,
  [body('resumeUrl').optional().isString(), body('linkedinUrl').optional().isString()],
  validate([body('resumeUrl'), body('linkedinUrl')], 'Invalid input'),
  (req: Request, res: Response, next: NextFunction) =>
    profileController.analyze(req, res, next)
);

export default router;
