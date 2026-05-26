import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { getCurrentUser } from '../middlewares/auth';
import { linkedinController } from '../controllers/linkedinController';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB — hard limit before hitting controller
  fileFilter(
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile?: boolean) => void
  ) {
    const accepted = ['application/pdf', 'application/octet-stream'];
    if (accepted.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted.'));
    }
  },
});

const router = Router();

// POST /api/linkedin/review
router.post(
  '/review',
  getCurrentUser,
  upload.single('file'),
  (req: Request, res: Response, next: NextFunction) =>
    linkedinController.review(req, res, next)
);

export default router;
