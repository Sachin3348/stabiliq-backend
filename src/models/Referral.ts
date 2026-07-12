import mongoose from 'mongoose';

export type ReferralStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

const referralSchema = new mongoose.Schema(
  {
    referrerUserId: { type: String, required: true, index: true },
    referredUserId: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
    rewardAmount: { type: Number, default: 500 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'referrals' }
);

export interface IReferralDoc extends mongoose.Document {
  referrerUserId: string;
  referredUserId: string;
  status: ReferralStatus;
  rewardAmount: number;
  completedAt: Date | null;
}

export const Referral = mongoose.model<IReferralDoc>('Referral', referralSchema);
