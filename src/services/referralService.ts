import { User } from '../models/User';
import { Referral } from '../models/Referral';
import { WalletTransaction } from '../models/WalletTransaction';

const REFERRAL_REWARD = 500;

export const referralService = {
  async attachReferralToUser(referredUserId: string, referralCode: string): Promise<void> {
    if (!referralCode) return;

    const referredUser = await User.findById(referredUserId, 'referredByUserId').lean().exec();
    if (!referredUser || referredUser.referredByUserId) return;

    const referrer = await User.findOne({ referralCode }).exec();
    if (!referrer) return;

    const referrerId = String(referrer._id);
    if (referrerId === referredUserId) return; // self-referral guard

    const existingReferral = await Referral.findOne({ referredUserId }).lean().exec();
    if (existingReferral) return;

    await User.findByIdAndUpdate(referredUserId, { referredByUserId: referrerId }).exec();

    await Referral.create({
      referrerUserId: referrerId,
      referredUserId,
      status: 'PENDING',
    });
  },

  async processReferralRewardOnPayment(referredUserId: string): Promise<void> {
    const user = await User.findById(referredUserId).exec();
    if (!user?.referredByUserId) return;

    const referral = await Referral.findOne({
      referredUserId,
      status: 'PENDING',
    }).exec();
    if (!referral) return; // already rewarded or no referral

    const now = new Date();
    referral.status = 'SUCCESS';
    referral.completedAt = now;
    await referral.save();

    await User.findByIdAndUpdate(referral.referrerUserId, {
      $inc: { walletBalance: REFERRAL_REWARD },
    }).exec();

    await WalletTransaction.create({
      userId: referral.referrerUserId,
      amount: REFERRAL_REWARD,
      source: 'REFERRAL',
      referenceId: String(referral._id),
    });
  },

  async getReferralStats(userId: string) {
    const user = await User.findById(userId, 'referralCode walletBalance').lean().exec();
    const referrals = await Referral.find({ referrerUserId: userId }).lean().exec();
    return {
      referralCode: user?.referralCode ?? null,
      walletBalance: user?.walletBalance ?? 0,
      total: referrals.length,
      successful: referrals.filter((r) => r.status === 'SUCCESS').length,
      pending: referrals.filter((r) => r.status === 'PENDING').length,
    };
  },
};
