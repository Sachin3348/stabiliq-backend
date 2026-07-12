import { Router, Request, Response, NextFunction } from 'express';
import { getCurrentUser } from '../middlewares/auth';
import { referralService } from '../services/referralService';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

router.get('/stats', getCurrentUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) { sendError(res, 401, 'Not authenticated'); return; }
    const stats = await referralService.getReferralStats(String(req.user.id));
    sendSuccess(res, 200, stats);
  } catch (err) {
    next(err);
  }
});

export default router;
