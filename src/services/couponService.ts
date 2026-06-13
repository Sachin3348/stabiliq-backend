import mongoose from 'mongoose';
import { couponRepository } from '../repository/couponRepository';
import { couponRedemptionRepository } from '../repository/couponRedemptionRepository';
import type {
  CreateCouponDto,
  CouponValidateResult,
  CouponRedeemResult,
} from '../types/coupon';
import type { ICouponDoc } from '../models/Coupon';

// ─────────────────────────────────────────────────────────────────────────────

function calcDiscount(coupon: ICouponDoc, originalAmount: number): number {
  let discount: number;

  if (coupon.type === 'percentage') {
    discount = Math.floor((originalAmount * coupon.value) / 100);
    if (coupon.maxDiscount != null) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    // flat
    discount = coupon.value;
  }

  // Discount can never exceed the original amount
  return Math.min(discount, originalAmount);
}

// ─────────────────────────────────────────────────────────────────────────────

export const couponService = {
  // ── Admin ──────────────────────────────────────────────────────────────────

  async create(dto: CreateCouponDto, adminUserId?: string): Promise<ICouponDoc> {
    return couponRepository.create(dto, adminUserId);
  },

  async expire(code: string): Promise<ICouponDoc | null> {
    return couponRepository.expire(code);
  },

  async list(onlyActive?: boolean): Promise<ICouponDoc[]> {
    const filter = onlyActive ? { isActive: true } : {};
    return couponRepository.findAll(filter);
  },

  async getByCode(code: string): Promise<ICouponDoc | null> {
    return couponRepository.findByCode(code);
  },

  async toggle(code: string, isActive: boolean): Promise<ICouponDoc | null> {
    return couponRepository.update(code, { isActive });
  },

  async getStats(code: string): Promise<{
    coupon: ICouponDoc | null;
    totalDiscountGiven: number;
    redemptions: Awaited<ReturnType<typeof couponRedemptionRepository.findByCouponId>>;
  }> {
    const coupon = await couponRepository.findByCode(code);
    if (!coupon) return { coupon: null, totalDiscountGiven: 0, redemptions: [] };

    const [totalDiscountGiven, redemptions] = await Promise.all([
      couponRedemptionRepository.totalDiscountByCoupon(coupon._id as mongoose.Types.ObjectId),
      couponRedemptionRepository.findByCouponId(coupon._id as mongoose.Types.ObjectId),
    ]);
    return { coupon, totalDiscountGiven, redemptions };
  },

  // ── User-facing ────────────────────────────────────────────────────────────

  /**
   * Validate a coupon code without marking it as used.
   * Call this to show the user the discounted price before payment.
   *
   * @param code            - coupon code (case-insensitive)
   * @param userId          - authenticated user's ObjectId string
   * @param context         - product context, e.g. "course", "subscription"
   * @param originalAmount  - cart/order value in paise
   */
  async validate(
    code: string,
    userId: string,
    context: string,
    originalAmount: number
  ): Promise<CouponValidateResult> {
    const coupon = await couponRepository.findByCode(code);

    if (!coupon) return { valid: false, reason: 'Invalid coupon code.' };
    if (!coupon.isActive) return { valid: false, reason: 'This coupon is no longer active.' };
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return { valid: false, reason: 'This coupon has expired.' };
    }

    // Context check
    if (!coupon.applicableTo.includes('*') && !coupon.applicableTo.includes(context)) {
      return { valid: false, reason: 'This coupon is not applicable here.' };
    }

    // Minimum order check
    if (coupon.minOrderAmount != null && originalAmount < coupon.minOrderAmount) {
      const minFormatted = (coupon.minOrderAmount / 100).toFixed(2);
      return { valid: false, reason: `Minimum order amount is ₹${minFormatted}.` };
    }

    // Global usage cap
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, reason: 'This coupon has reached its usage limit.' };
    }

    // Per-user cap (only count confirmed redemptions)
    if (coupon.usageLimitPerUser != null) {
      const userCount = await couponRedemptionRepository.countByUserAndCoupon(
        new mongoose.Types.ObjectId(userId),
        coupon._id as mongoose.Types.ObjectId
      );
      if (userCount >= coupon.usageLimitPerUser) {
        return { valid: false, reason: 'You have already used this coupon.' };
      }
    }

    const discountAmount = calcDiscount(coupon, originalAmount);
    const finalAmount = Math.round((originalAmount - discountAmount) * 100) / 100;

    return {
      valid: true,
      discountAmount,
      finalAmount,
      couponId: coupon._id as mongoose.Types.ObjectId,
      code: coupon.code,
    };
  },

  /**
   * Reserve a coupon for an in-flight order.
   * Creates an UNCONFIRMED redemption record and increments usedCount atomically.
   * Call this right before initiating payment.
   * Returns a redemptionId — store it so you can confirm or rollback later.
   */
  async reserve(
    code: string,
    userId: string,
    context: string,
    originalAmount: number
  ): Promise<{ redemptionId: mongoose.Types.ObjectId; discountAmount: number; finalAmount: number }> {
    const result = await this.validate(code, userId, context, originalAmount);
    if (!result.valid) throw new Error(result.reason);

    // Atomically grab a slot
    await couponRepository.incrementUsage(result.couponId);

    const redemption = await couponRedemptionRepository.create({
      couponId: result.couponId,
      userId: new mongoose.Types.ObjectId(userId),
      context,
      originalAmount,
      discountApplied: result.discountAmount,
      finalAmount: result.finalAmount,
      confirmed: false,
    });

    return {
      redemptionId: redemption._id as mongoose.Types.ObjectId,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
    };
  },

  /**
   * Confirm a previously reserved redemption after payment succeeds.
   * Call this in your payment webhook / success handler.
   */
  async confirm(
    redemptionId: mongoose.Types.ObjectId,
    orderId?: string
  ): Promise<CouponRedeemResult> {
    const redemption = await couponRedemptionRepository.confirm(redemptionId, orderId);
    if (!redemption) throw new Error('Redemption record not found.');

    return {
      discountAmount: redemption.discountApplied,
      finalAmount: redemption.finalAmount,
      redemptionId: redemption._id as mongoose.Types.ObjectId,
    };
  },

  /**
   * Auto-rollback: delete the unconfirmed reservation and decrement usedCount.
   * Call this when payment fails or is cancelled.
   */
  async rollback(redemptionId: mongoose.Types.ObjectId): Promise<void> {
    const redemption = await couponRedemptionRepository.findById(redemptionId);
    if (!redemption || redemption.confirmed) return; // nothing to roll back

    await Promise.all([
      couponRedemptionRepository.deleteUnconfirmed(redemptionId),
      couponRepository.decrementUsage(redemption.couponId),
    ]);
  },
};
