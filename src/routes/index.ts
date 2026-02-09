import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { apiController } from '../controllers/apiController';
import { validate } from '../middlewares/validate';

const router = Router();

router.get('/', apiController.root);

router.post(
  '/status',
  [body('client_name').notEmpty()],
  validate([body('client_name')], 'client_name is required'),
  (req: Request, res: Response, next: NextFunction) => apiController.createStatus(req, res, next)
);

router.get('/status', (req: Request, res: Response, next: NextFunction) =>
  apiController.listStatus(req, res, next)
);

export default router;
