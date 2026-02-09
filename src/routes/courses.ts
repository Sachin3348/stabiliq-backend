import { Router, Request, Response, NextFunction } from 'express';
import { coursesController } from '../controllers/coursesController';
import { getCurrentUser } from '../middlewares/auth';

const router = Router();

router.get('/modules', getCurrentUser, (req: Request, res: Response) =>
  coursesController.getModules(req, res)
);

router.get(
  '/modules/:module_id',
  getCurrentUser,
  (req: Request, res: Response, next: NextFunction) =>
    coursesController.getModuleById(req, res, next)
);

router.post(
  '/modules/:module_id/lessons/:lesson_id/complete',
  getCurrentUser,
  (req: Request, res: Response) => coursesController.markLessonComplete(req, res)
);

export default router;
