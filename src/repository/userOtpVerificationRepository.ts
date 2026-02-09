import { UserOtpVerification, IUserOtpVerificationDoc } from '../models/UserOtpVerification';

const normalizeEmail = (email: string): string => email.toLowerCase().trim();

export const userOtpVerificationRepository = {
  /**
   * Store OTP for email. Marks any existing unconsumed OTP for this email as consumed (superseded).
   */
  async create(email: string, otp: string, expiresAt: Date): Promise<IUserOtpVerificationDoc> {
    const key = normalizeEmail(email);
    const now = new Date();
    await UserOtpVerification.updateMany(
      { email: key, consumed: false },
      { $set: { consumed: true, consumedAt: now } }
    ).exec();
    const doc = new UserOtpVerification({
      email: key,
      otp,
      expiresAt,
      consumed: false,
      consumedAt: null,
      createdAt: now,
    });
    await doc.save();
    return doc;
  },

  /**
   * Find the latest OTP record for email (if any). Optionally only unconsumed.
   */
  async findByEmail(
    email: string,
    options?: { unconsumedOnly?: boolean }
  ): Promise<IUserOtpVerificationDoc | null> {
    const query: { email: string; consumed?: boolean } = { email: normalizeEmail(email) };
    if (options?.unconsumedOnly) query.consumed = false;
    return UserOtpVerification.findOne(query).sort({ createdAt: -1 }).exec();
  },

  /**
   * Validate OTP for email and mark the record as consumed (one-time use). Returns true if valid.
   * Keeps the record in DB with consumed=true and consumedAt set for audit.
   */
  async validateAndConsume(email: string, otp: string): Promise<boolean> {
    const key = normalizeEmail(email);
    const now = new Date();
    const doc = await UserOtpVerification.findOneAndUpdate(
      { email: key, otp, consumed: false, expiresAt: { $gt: now } },
      { $set: { consumed: true, consumedAt: now } },
      { new: true }
    ).exec();
    return doc != null;
  },
};
