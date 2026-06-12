import { Router, Request, Response, NextFunction } from 'express';
import { getCurrentUser } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/requireAdmin';
import { couponController } from '../controllers/couponController';

const router = Router();

// ── Admin routes (getCurrentUser + requireAdmin) ───────────────────────────
router.post(
  '/',
  getCurrentUser, requireAdmin,
  (req: Request, res: Response, next: NextFunction) => couponController.create(req, res, next)
);

router.get(
  '/',
  getCurrentUser, requireAdmin,
  (req: Request, res: Response, next: NextFunction) => couponController.list(req, res, next)
);

router.get(
  '/:code',
  getCurrentUser, requireAdmin,
  (req: Request, res: Response, next: NextFunction) => couponController.getOne(req, res, next)
);

router.patch(
  '/:code/expire',
  getCurrentUser, requireAdmin,
  (req: Request, res: Response, next: NextFunction) => couponController.expire(req, res, next)
);

router.patch(
  '/:code',
  getCurrentUser, requireAdmin,
  (req: Request, res: Response, next: NextFunction) => couponController.toggle(req, res, next)
);

router.get(
  '/:code/stats',
  getCurrentUser, requireAdmin,
  (req: Request, res: Response, next: NextFunction) => couponController.stats(req, res, next)
);

// ── User-facing ────────────────────────────────────────────────────────────
router.post(
  '/validate',
  getCurrentUser,
  (req: Request, res: Response, next: NextFunction) => couponController.validate(req, res, next)
);

export default router;
