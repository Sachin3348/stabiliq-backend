import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { body, query } from 'express-validator';
import { leadController } from '../controllers/leadController';
import { getCurrentUser } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validate } from '../middlewares/validate';
import { requestTimeout } from '../middlewares/requestTimeout';

const router = Router();

const VALID_STAGE = ['new', 'contacted', 'qualified', 'converted', 'lost', 'unqualified'] as const;
const VALID_SOURCE_CATEGORY = ['website', 'referral', 'ad_campaign', 'partner', 'organic', 'internal'] as const;

const captureRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Too many requests, please try again later.' },
});

// ── Public capture ──────────────────────────────────────────────────────────
router.post(
  '/capture',
  captureRateLimit,
  requestTimeout(15000),
  [
    body('sourceCategory').notEmpty().isIn(VALID_SOURCE_CATEGORY),
    body('source').notEmpty().trim(),
    body('phone').optional().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('name').optional().trim(),
    body('referralCode').optional().trim(),
    body('message').optional().trim(),
    body('utm').optional().isObject(),
    body('utm.source').optional().trim(),
    body('utm.medium').optional().trim(),
    body('utm.campaign').optional().trim(),
    body('utm.term').optional().trim(),
    body('utm.content').optional().trim(),
  ],
  validate([body('sourceCategory'), body('source')], 'sourceCategory and source are required'),
  (req: Request, res: Response, next: NextFunction) => leadController.capture(req, res, next)
);

// ── Admin routes ─────────────────────────────────────────────────────────────
router.use('/admin', getCurrentUser, requireAdmin);

router.get(
  '/admin',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('stage').optional().isIn(VALID_STAGE),
    query('sourceCategory').optional().isIn(VALID_SOURCE_CATEGORY),
  ],
  (req: Request, res: Response, next: NextFunction) => leadController.list(req, res, next)
);

router.get(
  '/admin/:leadId',
  (req: Request, res: Response, next: NextFunction) => leadController.getOne(req, res, next)
);

router.patch(
  '/admin/:leadId/stage',
  [
    body('stage').notEmpty().isIn(VALID_STAGE),
    body('note').optional().trim(),
  ],
  validate([body('stage')], 'stage is required'),
  (req: Request, res: Response, next: NextFunction) => leadController.updateStage(req, res, next)
);

router.patch(
  '/admin/:leadId/assign',
  [body('adminUserId').notEmpty().trim()],
  validate([body('adminUserId')], 'adminUserId is required'),
  (req: Request, res: Response, next: NextFunction) => leadController.assign(req, res, next)
);

router.post(
  '/admin/:leadId/call',
  [body('note').notEmpty().trim()],
  validate([body('note')], 'note is required'),
  (req: Request, res: Response, next: NextFunction) => leadController.logCall(req, res, next)
);

router.post(
  '/admin/:leadId/convert',
  [body('userId').notEmpty().trim()],
  validate([body('userId')], 'userId is required'),
  (req: Request, res: Response, next: NextFunction) => leadController.convert(req, res, next)
);

export default router;
