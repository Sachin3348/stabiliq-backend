import mongoose from 'mongoose';
import { PAYMENT_STATUS, TRANSACTION_TYPE } from '../types/payment';

const paymentTransactionSchema = new mongoose.Schema(
  {
    merchantTransactionId: { type: String, trim: true },
    merchantId: { type: String },
    totalAmount: { type: Number },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', trim: true },
    amount: { type: Number },
    phonepeTransactionId: { type: String, trim: true },
    paymentStatus: { type: String, enum: Object.values(PAYMENT_STATUS) },
    type: { type: String, enum: Object.values(TRANSACTION_TYPE) },
    refundId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentTransaction' },
    isUiCallbackProcessed: { type: Boolean, default: false },
    paymentInstrument: mongoose.Schema.Types.Mixed,
    isDeleted: { type: Boolean, default: false },
    isApplicationFeeProcessed: { type: Boolean, default: false },
    gatewayOrderId: { type: String },
    plan: { type: String, enum: ['basic', 'pro'] },
  },
  { timestamps: true }
);

paymentTransactionSchema.index({ merchantTransactionId: 1 });

export interface IPaymentTransactionDoc extends mongoose.Document {
  merchantTransactionId?: string;
  merchantId?: string;
  totalAmount?: number;
  userId?: mongoose.Types.ObjectId;
  amount?: number;
  phonepeTransactionId?: string;
  paymentStatus?: string;
  type?: string;
  refundId?: mongoose.Types.ObjectId;
  isUiCallbackProcessed?: boolean;
  paymentInstrument?: Record<string, unknown>;
  isDeleted?: boolean;
  isApplicationFeeProcessed?: boolean;
  gatewayOrderId?: string;
  plan?: 'basic' | 'pro';
  createdAt: Date;
  updatedAt: Date;
}

export const PaymentTransaction = mongoose.model<IPaymentTransactionDoc>(
  'PaymentTransaction',
  paymentTransactionSchema,
  'payment-transaction'
);
