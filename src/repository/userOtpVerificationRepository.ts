import { UserOtpVerification, IUserOtpVerificationDoc } from '../models/UserOtpVerification';

const normalizePhone = (phone: string): string => phone.trim();

export const userOtpVerificationRepository = {
  async create(phone: string, otp: string, expiresAt: Date): Promise<IUserOtpVerificationDoc> {
    const key = normalizePhone(phone);
    const now = new Date();
    await UserOtpVerification.updateMany(
      { phone: key, consumed: false },
      { $set: { consumed: true, consumedAt: now } }
    ).exec();
    const doc = new UserOtpVerification({
      phone: key,
      otp,
      expiresAt,
      consumed: false,
      consumedAt: null,
      createdAt: now,
    });
    await doc.save();
    return doc;
  },

  async findByPhone(
    phone: string,
    options?: { unconsumedOnly?: boolean }
  ): Promise<IUserOtpVerificationDoc | null> {
    const query: { phone: string; consumed?: boolean } = { phone: normalizePhone(phone) };
    if (options?.unconsumedOnly) query.consumed = false;
    return UserOtpVerification.findOne(query).sort({ createdAt: -1 }).exec();
  },

  async validateAndConsume(phone: string, otp: string): Promise<boolean> {
    const key = normalizePhone(phone);
    const now = new Date();
    const doc = await UserOtpVerification.findOneAndUpdate(
      { phone: key, otp, consumed: false, expiresAt: { $gt: now } },
      { $set: { consumed: true, consumedAt: now } },
      { new: true }
    ).exec();
    return doc != null;
  },
};
