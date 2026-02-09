import { Router, Request, Response, NextFunction } from 'express';
import { financialAssistanceController } from '../controllers/financialAssistanceController';
import { getCurrentUser } from '../middlewares/auth';

const router = Router();

router.get('/status', getCurrentUser, (req: Request, res: Response, next: NextFunction) =>
  financialAssistanceController.getStatus(req, res, next)
);

router.post('/request', getCurrentUser, (req: Request, res: Response, next: NextFunction) =>
  financialAssistanceController.submitRequest(req, res, next)
);

router.get('/documents-required', (req: Request, res: Response) =>
  financialAssistanceController.getDocumentsRequired(req, res)
);

export default router;
