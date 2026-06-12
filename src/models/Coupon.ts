import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,  // always stored uppercase, matched case-insensitively
      trim: true,
    },
    type: {
      type: String,
      enum: ['percentage', 'flat'],
      required: true,
    },
    /** percentage: 1-100  |  flat: amount in paise */
    value: {
      type: Number,
      required: true,
      min: 1,
    },
    /** paise — maximum discount cap (useful for percentage coupons) */
    maxDiscount: {
      type: Number,
      default: null,
    },
    /** paise — minimum cart value required */
    minOrderAmount: {
      type: Number,
      default: null,
    },
    /** ["course", "subscription", "*"]  — * means all contexts */
    applicableTo: {
      type: [String],
      default: ['*'],
    },
    /** Total number of times this coupon can be redeemed (null = unlimited) */
    usageLimit: {
      type: Number,
      default: null,
    },
    /** Per-user redemption cap (null = unlimited) */
    usageLimitPerUser: {
      type: Number,
      default: null,
    },
    /** Counter incremented on each redemption */
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'coupons',
  }
);

// Case-insensitive lookup index
couponSchema.index({ code: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export interface ICouponDoc extends mongoose.Document {
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  maxDiscount: number | null;
  minOrderAmount: number | null;
  applicableTo: string[];
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: Date | null;
  createdBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export const Coupon = mongoose.model<ICouponDoc>('Coupon', couponSchema);
