import { Request, Response, NextFunction } from 'express';
import { couponService } from '../services/couponService';
import { sendSuccess, sendError } from '../utils/response';
import { MEMBERSHIP_PLANS } from '../utils/constants';
import type { CreateCouponDto } from '../types/coupon';

export const couponController = {
  // ── Admin ──────────────────────────────────────────────────────────────────

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as CreateCouponDto;

      if (!dto.code?.trim()) { sendError(res, 400, 'code is required.'); return; }
      if (!dto.type || !['percentage', 'flat'].includes(dto.type)) {
        sendError(res, 400, "type must be 'percentage' or 'flat'."); return;
      }
      if (typeof dto.value !== 'number' || dto.value <= 0) {
        sendError(res, 400, 'value must be a positive number.'); return;
      }
      if (dto.type === 'percentage' && dto.value > 100) {
        sendError(res, 400, 'Percentage value must be between 1 and 100.'); return;
      }
      if (dto.expiresAt && new Date(dto.expiresAt) <= new Date()) {
        sendError(res, 400, 'expiresAt must be a future date.'); return;
      }

      const adminId = req.user?.id?.toString();
      const coupon = await couponService.create(dto, adminId);
      sendSuccess(res, 201, { coupon });
    } catch (err: unknown) {
      // Duplicate key
      if ((err as { code?: number }).code === 11000) {
        sendError(res, 409, 'A coupon with this code already exists.');
        return;
      }
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const onlyActive = req.query.active === 'true';
      const coupons = await couponService.list(onlyActive);
      sendSuccess(res, 200, { coupons });
    } catch (err) { next(err); }
  },

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.params;
      const coupon = await couponService.getByCode(code);
      if (!coupon) { sendError(res, 404, 'Coupon not found.'); return; }
      sendSuccess(res, 200, { coupon });
    } catch (err) { next(err); }
  },

  async expire(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.params;
      const coupon = await couponService.expire(code);
      if (!coupon) { sendError(res, 404, 'Coupon not found.'); return; }
      sendSuccess(res, 200, { message: 'Coupon expired.', coupon });
    } catch (err) { next(err); }
  },

  async toggle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.params;
      const { isActive } = req.body as { isActive?: boolean };
      if (typeof isActive !== 'boolean') {
        sendError(res, 400, 'isActive (boolean) is required.'); return;
      }
      const coupon = await couponService.toggle(code, isActive);
      if (!coupon) { sendError(res, 404, 'Coupon not found.'); return; }
      sendSuccess(res, 200, { coupon });
    } catch (err) { next(err); }
  },

  async stats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.params;
      const data = await couponService.getStats(code);
      if (!data.coupon) { sendError(res, 404, 'Coupon not found.'); return; }
      sendSuccess(res, 200, data);
    } catch (err) { next(err); }
  },

  // ── User-facing ────────────────────────────────────────────────────────────

  async validate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { sendError(res, 401, 'Not authenticated.'); return; }

      const { code, context, plan } = req.body as {
        code?: string;
        context?: string;
        plan?: string;
      };

      if (!code?.trim())    { sendError(res, 400, 'code is required.'); return; }
      if (!context?.trim()) { sendError(res, 400, 'context is required.'); return; }
      if (!plan?.trim() || !MEMBERSHIP_PLANS[plan as 'basic' | 'pro']) {
        sendError(res, 400, 'plan must be basic or pro.'); return;
      }

      const amount = MEMBERSHIP_PLANS[plan as 'basic' | 'pro'].totalAmount;

      const result = await couponService.validate(
        code.trim(),
        req.user.id.toString(),
        context.trim(),
        amount
      );

      sendSuccess(res, 200, result);
    } catch (err) { next(err); }
  },
};
