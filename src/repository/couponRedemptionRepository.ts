import mongoose from 'mongoose';
import { CouponRedemption, ICouponRedemptionDoc } from '../models/CouponRedemption';

export const couponRedemptionRepository = {
  async create(data: {
    couponId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    context: string;
    originalAmount: number;
    discountApplied: number;
    finalAmount: number;
    orderId?: string | null;
    confirmed?: boolean;
  }): Promise<ICouponRedemptionDoc> {
    return CouponRedemption.create(data);
  },

  /** Count how many CONFIRMED redemptions a user has for a specific coupon */
  async countByUserAndCoupon(
    userId: mongoose.Types.ObjectId,
    couponId: mongoose.Types.ObjectId
  ): Promise<number> {
    return CouponRedemption.countDocuments({ userId, couponId, confirmed: true }).exec();
  },

  /** Confirm redemption after order/payment succeeds */
  async confirm(
    redemptionId: mongoose.Types.ObjectId,
    orderId?: string
  ): Promise<ICouponRedemptionDoc | null> {
    return CouponRedemption.findByIdAndUpdate(
      redemptionId,
      { $set: { confirmed: true, ...(orderId && { orderId }) } },
      { new: true }
    ).exec();
  },

  /** Delete unconfirmed redemption (rollback) */
  async deleteUnconfirmed(redemptionId: mongoose.Types.ObjectId): Promise<void> {
    await CouponRedemption.findByIdAndDelete(redemptionId).exec();
  },

  async findById(id: mongoose.Types.ObjectId): Promise<ICouponRedemptionDoc | null> {
    return CouponRedemption.findById(id).exec();
  },

  async findByUserId(userId: string): Promise<ICouponRedemptionDoc[]> {
    return CouponRedemption.find({ userId: new mongoose.Types.ObjectId(userId), confirmed: true })
      .sort({ redeemedAt: -1 })
      .populate('couponId', 'code type value')
      .exec();
  },

  /** Admin: all redemptions for a coupon */
  async findByCouponId(couponId: mongoose.Types.ObjectId): Promise<ICouponRedemptionDoc[]> {
    return CouponRedemption.find({ couponId, confirmed: true })
      .sort({ redeemedAt: -1 })
      .populate('userId', 'name email')
      .exec();
  },

  /** Total discount given for a coupon (admin stats) */
  async totalDiscountByCoupon(couponId: mongoose.Types.ObjectId): Promise<number> {
    const result = await CouponRedemption.aggregate([
      { $match: { couponId, confirmed: true } },
      { $group: { _id: null, total: { $sum: '$discountApplied' } } },
    ]);
    return result[0]?.total ?? 0;
  },
};
