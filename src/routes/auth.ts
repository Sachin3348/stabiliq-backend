import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/authController';
import { getCurrentUser } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

router.post(
  '/send-otp',
  [body('email').isEmail().normalizeEmail(), body('phone').notEmpty().trim()],
  validate([body('email'), body('phone')], 'Email and phone are required'),
  (req: Request, res: Response, next: NextFunction) => authController.sendOtp(req, res, next)
);

router.post(
  '/verify-otp',
  [
    body('email').isEmail().normalizeEmail(),
    body('phone').notEmpty().trim(),
    body('otp').notEmpty(),
    body('name').notEmpty().trim(),
  ],
  validate([body('email'), body('phone'), body('otp'), body('name')], 'All fields are required'),
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
