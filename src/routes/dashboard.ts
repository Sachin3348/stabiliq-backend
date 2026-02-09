import { Router, Request, Response, NextFunction } from 'express';
import { dashboardController } from '../controllers/dashboardController';
import { getCurrentUser } from '../middlewares/auth';

const router = Router();

router.get('/stats', getCurrentUser, (req: Request, res: Response, next: NextFunction) =>
  dashboardController.getStats(req, res, next)
);

export default router;
