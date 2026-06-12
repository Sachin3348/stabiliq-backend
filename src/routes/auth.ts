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
  [body('email').isEmail().normalizeEmail(), body('phone').optional().trim()],
  validate([body('email')], 'Email is required'),
  (req: Request, res: Response, next: NextFunction) => authController.sendOtp(req, res, next)
);

router.post(
  '/verify-otp',
  [
    body('email').isEmail().normalizeEmail(),
    body('phone').optional().trim(),
    body('otp').notEmpty(),
    body('name').optional().trim(),
  ],
  validate([body('email'), body('otp')], 'email and otp are required'),
  (req: Request, res: Response, next: NextFunction) => authController.verifyOtp(req, res, next)
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail()],
  validate([body('email')], 'Email is required'),
  (req: Request, res: Response, next: NextFunction) => authController.login(req, res, next)
);

router.get('/me', getCurrentUser, (req: Request, res: Response, next: NextFunction) =>
  authController.me(req, res, next)
);

router.post('/logout', (req: Request, res: Response) => authController.logout(req, res));

export default router;
