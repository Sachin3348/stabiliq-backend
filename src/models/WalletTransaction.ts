import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    source: { type: String, required: true }, // e.g. "REFERRAL"
    referenceId: { type: String, default: null }, // referral _id or other ref
  },
  { timestamps: true, collection: 'wallet_transactions' }
);

export interface IWalletTransactionDoc extends mongoose.Document {
  userId: string;
  amount: number;
  source: string;
  referenceId: string | null;
}

export const WalletTransaction = mongoose.model<IWalletTransactionDoc>(
  'WalletTransaction',
  walletTransactionSchema
);
