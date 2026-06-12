import mongoose from 'mongoose';

const couponRedemptionSchema = new mongoose.Schema(
  {
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    /** The product context this was applied to, e.g. "course", "subscription" */
    context: {
      type: String,
      required: true,
    },
    /** Optional order/payment ID from the calling module */
    orderId: {
      type: String,
      default: null,
    },
    originalAmount: {
      type: Number,
      required: true,   // paise
    },
    discountApplied: {
      type: Number,
      required: true,   // paise
    },
    finalAmount: {
      type: Number,
      required: true,   // paise
    },
    /** false until the order/payment is confirmed; true after CouponService.redeem() */
    confirmed: {
      type: Boolean,
      default: false,
    },
    redeemedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: 'coupon_redemptions',
  }
);

// Fast per-user lookup
couponRedemptionSchema.index({ couponId: 1, userId: 1 });
couponRedemptionSchema.index({ userId: 1 });

export interface ICouponRedemptionDoc extends mongoose.Document {
  couponId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  context: string;
  orderId: string | null;
  originalAmount: number;
  discountApplied: number;
  finalAmount: number;
  confirmed: boolean;
  redeemedAt: Date;
}

export const CouponRedemption = mongoose.model<ICouponRedemptionDoc>(
  'CouponRedemption',
  couponRedemptionSchema
);
