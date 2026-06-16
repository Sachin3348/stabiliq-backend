import mongoose from 'mongoose';

export type CouponType = 'percentage' | 'flat';

export type CouponContext = string; // e.g. "course" | "subscription" | "*"

// ── Admin create DTO ─────────────────────────────────────────────────────────
export interface CreateCouponDto {
  code: string;
  type: CouponType;
  value: number;                    // paise for flat, integer % for percentage (1-100)
  maxDiscount?: number | null;      // paise — cap on percentage discount
  minOrderAmount?: number | null;   // paise — minimum cart value
  applicableTo?: CouponContext[];   // defaults to ["*"]
  usageLimit?: number | null;       // total redemptions allowed
  usageLimitPerUser?: number | null;
  expiresAt?: Date | null;
}

// ── Validate result ──────────────────────────────────────────────────────────
export interface CouponValidResult {
  valid: true;
  discountAmount: number;
  baseAmount: number;
  gstAmount: number;
  finalAmount: number;
  couponId: mongoose.Types.ObjectId;
  code: string;
}

export interface CouponInvalidResult {
  valid: false;
  reason: string;
}

export type CouponValidateResult = CouponValidResult | CouponInvalidResult;

// ── Redeem result ────────────────────────────────────────────────────────────
export interface CouponRedeemResult {
  discountAmount: number;   // paise
  finalAmount: number;      // paise
  redemptionId: mongoose.Types.ObjectId;
}
