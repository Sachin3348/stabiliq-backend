import { Router, Request, Response, NextFunction } from 'express';
import { paymentController } from '../controllers/paymentController';
import { getCurrentUser } from '../middlewares/auth';

const router = Router();

/** Create a payment transaction (e.g. init) */
router.post('/', getCurrentUser, (req: Request, res: Response, next: NextFunction) =>
  paymentController.create(req, res, next)
);

/** Get current user's transactions (requires auth) - must be before /:id */
router.get('/user/me', getCurrentUser, (req: Request, res: Response, next: NextFunction) =>
  paymentController.getMyTransactions(req, res, next)
);

/** Get transaction by merchant transaction ID - must be before /:id */
router.get(
  '/merchant/:merchantTransactionId',
  (req: Request, res: Response, next: NextFunction) =>
    paymentController.getByMerchantTransactionId(req, res, next)
);

/** Get transaction by ID */
router.get('/:id', (req: Request, res: Response, next: NextFunction) =>
  paymentController.getById(req, res, next)
);

/** Update transaction (e.g. callback) */
router.patch('/:id', (req: Request, res: Response, next: NextFunction) =>
  paymentController.update(req, res, next)
);

export default router;
