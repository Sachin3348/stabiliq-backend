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
    isPaymentProcessed: { type: Boolean, default: false },
    gatewayOrderId: { type: String },
    plan: { type: String, enum: ['basic', 'pro'] },
    gateway: { type: String, enum: ['phonepe', 'cashfree'], default: 'phonepe' },
    redemptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CouponRedemption' },
    baseAmount: { type: Number },
    gstAmount: { type: Number },
    discountAmount: { type: Number },
    couponCode: { type: String },
  },
  { timestamps: true }
);

paymentTransactionSchema.index({ merchantTransactionId: 1 });

export interface IPaymentTransactionDoc extends mongoose.Document {
  merchantTransactionId: string;
  merchantId: string;
  totalAmount: number;
  userId: mongoose.Types.ObjectId;
  amount: number;
  phonepeTransactionId?: string;
  paymentStatus?: string;
  type: string;
  refundId?: mongoose.Types.ObjectId;
  isUiCallbackProcessed?: boolean;
  paymentInstrument?: Record<string, unknown>;
  isDeleted: boolean;
  isPaymentProcessed?: boolean;
  gatewayOrderId?: string;
  plan?: 'basic' | 'pro';
  gateway?: 'phonepe' | 'cashfree';
  redemptionId?: mongoose.Types.ObjectId;
  baseAmount?: number;
  gstAmount?: number;
  discountAmount?: number;
  couponCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const PaymentTransaction = mongoose.model<IPaymentTransactionDoc>(
  'PaymentTransaction',
  paymentTransactionSchema,
  'payment-transaction'
);
