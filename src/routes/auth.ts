import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/authController';
import { getCurrentUser } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { requestTimeout } from '../middlewares/requestTimeout';

const router = Router();

// Auth routes can hang on DB or email; return 504 after 25s instead of no response
router.use(requestTimeout(25000));

router.post(
  '/send-otp',
  [body('phone').notEmpty().trim(), body('email').optional().isEmail().normalizeEmail()],
  validate([body('phone')], 'Phone is required'),
  (req: Request, res: Response, next: NextFunction) => authController.sendOtp(req, res, next)
);

router.post(
  '/verify-otp',
  [
    body('phone').notEmpty().trim(),
    body('otp').notEmpty(),
    body('name').optional().trim(),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  validate([body('phone'), body('otp')], 'phone and otp are required'),
  (req: Request, res: Response, next: NextFunction) => authController.verifyOtp(req, res, next)
);

router.post(
  '/login',
  [body('phone').notEmpty().trim()],
  validate([body('phone')], 'Phone is required'),
  (req: Request, res: Response, next: NextFunction) => authController.login(req, res, next)
);

router.get('/me', getCurrentUser, (req: Request, res: Response, next: NextFunction) =>
  authController.me(req, res, next)
);

router.post('/logout', (req: Request, res: Response) => authController.logout(req, res));

export default router;
