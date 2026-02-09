import { Request, Response } from 'express';
import { authService } from '../services';
import { sendError, sendSuccess } from '../utils/response';

export const authController = {
  async sendOtp(req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      const { email, phone } = req.body as { email: string; phone: string };
      const result = await authService.sendOtp(email, phone);
      sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },

  async verifyOtp(req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      const { email, phone, otp, name, plan } = req.body as {
        email: string;
        phone: string;
        otp: string;
        name: string;
        plan?: string;
      };
      const result = await authService.verifyOtp(email, phone, otp, name, plan ?? 'basic');
      sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      const { email } = req.body as { email: string };
      const result = await authService.login(email);
      sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Not authenticated');
        return;
      }
      const result = await authService.me(req.user);
      sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },

  logout(_req: Request, res: Response): Response {
    return sendSuccess(res, 200, {
      success: true,
      message: 'Logged out successfully',
    });
  },
};
