import { Request, Response } from 'express';
import { authService } from '../services';
import { sendError, sendSuccess } from '../utils/response';

export const authController = {
  async sendOtp(req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      const { phone, email } = req.body as { phone: string; email?: string };
      const result = await authService.sendOtp(phone, email);
      sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },

  async verifyOtp(req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      const { phone, otp, name, email } = req.body as {
        phone: string;
        otp: string;
        name?: string;
        email?: string;
      };
      const result = await authService.verifyOtp(phone, otp, name, email);
      sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      const { phone } = req.body as { phone: string };
      const result = await authService.login(phone);
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
