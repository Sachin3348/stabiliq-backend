import mongoose from 'mongoose';
import { Coupon, ICouponDoc } from '../models/Coupon';
import type { CreateCouponDto } from '../types/coupon';

export const couponRepository = {
  async create(dto: CreateCouponDto, createdBy?: string): Promise<ICouponDoc> {
    return Coupon.create({
      ...dto,
      code: dto.code.toUpperCase().trim(),
      applicableTo: dto.applicableTo ?? ['*'],
      createdBy: createdBy ? new mongoose.Types.ObjectId(createdBy) : null,
    });
  },

  /** Case-insensitive lookup */
  async findByCode(code: string): Promise<ICouponDoc | null> {
    return Coupon.findOne({ code: code.toUpperCase().trim() }).collation({ locale: 'en', strength: 2 }).exec();
  },

  async findById(id: string): Promise<ICouponDoc | null> {
    return Coupon.findById(id).exec();
  },

  async findAll(filter: Record<string, unknown> = {}): Promise<ICouponDoc[]> {
    return Coupon.find(filter).sort({ createdAt: -1 }).exec();
  },

  /** Atomically increment usedCount — returns updated doc */
  async incrementUsage(couponId: mongoose.Types.ObjectId): Promise<ICouponDoc | null> {
    return Coupon.findByIdAndUpdate(
      couponId,
      { $inc: { usedCount: 1 } },
      { new: true }
    ).exec();
  },

  /** Atomically decrement usedCount (rollback) */
  async decrementUsage(couponId: mongoose.Types.ObjectId): Promise<void> {
    await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: -1 } }).exec();
  },

  /** Set isActive = false and optionally set expiresAt to now */
  async expire(code: string): Promise<ICouponDoc | null> {
    return Coupon.findOneAndUpdate(
      { code: code.toUpperCase().trim() },
      { $set: { isActive: false, expiresAt: new Date() } },
      { new: true }
    ).collation({ locale: 'en', strength: 2 }).exec();
  },

  async update(
    code: string,
    patch: Partial<Pick<ICouponDoc, 'isActive' | 'usageLimit' | 'expiresAt' | 'maxDiscount' | 'minOrderAmount'>>
  ): Promise<ICouponDoc | null> {
    return Coupon.findOneAndUpdate(
      { code: code.toUpperCase().trim() },
      { $set: patch },
      { new: true }
    ).collation({ locale: 'en', strength: 2 }).exec();
  },
};
