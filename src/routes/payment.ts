import { Router, Request, Response } from 'express';
import { paymentController } from '../controllers/paymentController';
import { getCurrentUser, phonepeS2SCallbackAuth } from '../middlewares/auth';

const router = Router();

/** Create a payment transaction (e.g. init) */
router.post('/', getCurrentUser, (req: Request, res: Response) =>
  paymentController.create(req, res)
);

//called when user complete the payment (UI Callback)
router.post('/status', paymentController.handleUserPaymentCompletion) 

//called when payment reach a terminal state (failed, complete)
router.post('/callback', phonepeS2SCallbackAuth, paymentController.processPaymentS2SCallback) 

router.get("/payment-status", getCurrentUser, paymentController.getLastPaymentStatus)

//cashfree return url callback
router.get("/cashfree/status", paymentController.handlePaymentCompletionCashfree)

//called when refund transaction reach a terminal state
// router.post('/refund', phonepeS2SCallbackAuth, paymentController.processRefundS2Scallback)


// /** Get current user's transactions (requires auth) - must be before /:id */
// router.get('/user/me', getCurrentUser, (req: Request, res: Response, next: NextFunction) =>
//   paymentController.getMyTransactions(req, res, next)
// );

// /** Get transaction by merchant transaction ID - must be before /:id */
// router.get(
//   '/merchant/:merchantTransactionId',
//   (req: Request, res: Response, next: NextFunction) =>
//     paymentController.getByMerchantTransactionId(req, res, next)
// );

// /** Get transaction by ID */
// router.get('/:id', (req: Request, res: Response, next: NextFunction) =>
//   paymentController.getById(req, res, next)
// );

// /** Update transaction (e.g. callback) */
// router.patch('/:id', (req: Request, res: Response, next: NextFunction) =>
//   paymentController.update(req, res, next)
// );

export default router;
