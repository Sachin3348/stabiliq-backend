import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { getCurrentUser } from '../middlewares/auth';
import { targetedReviewController } from '../controllers/targetedReviewController';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// 5 requests per minute per IP — LLM call is expensive
const targetedReviewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests. Targeted review is limited to 5 per minute.',
    });
  },
});

const router = Router();

// POST /api/resume/targeted-review
router.post(
  '/targeted-review',
  targetedReviewLimiter,
  getCurrentUser,
  upload.single('file'),
  (req: Request, res: Response, next: NextFunction) =>
    targetedReviewController.review(req, res, next)
);

export default router;
