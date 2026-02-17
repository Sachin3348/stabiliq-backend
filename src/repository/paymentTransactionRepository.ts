import mongoose from 'mongoose';
import { PaymentTransaction, IPaymentTransactionDoc } from '../models/PaymentTransaction';
import type { PaymentTransactionDto } from '../types/payment';

function toDto(doc: IPaymentTransactionDoc): PaymentTransactionDto {
  return {
    id: doc._id.toString(),
    merchantTransactionId: doc.merchantTransactionId,
    merchantId: doc.merchantId,
    totalAmount: doc.totalAmount,
    userId: doc.userId?.toString(),
    amount: doc.amount,
    phonepeTransactionId: doc.phonepeTransactionId,
    paymentStatus: doc.paymentStatus as PaymentTransactionDto['paymentStatus'],
    type: doc.type as PaymentTransactionDto['type'],
    refundId: doc.refundId?.toString(),
    isUiCallbackProcessed: doc.isUiCallbackProcessed,
    paymentInstrument: doc.paymentInstrument as Record<string, unknown> | undefined,
    isDeleted: doc.isDeleted,
    isApplicationFeeProcessed: doc.isApplicationFeeProcessed,
    gatewayOrderId: doc.gatewayOrderId,
    plan: doc.plan as 'basic' | 'pro' | undefined,
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
  };
}

export interface CreatePaymentTransactionInput {
  merchantTransactionId?: string;
  merchantId?: string;
  totalAmount?: number;
  userId?: string;
  amount?: number;
  phonepeTransactionId?: string;
  paymentStatus?: string;
  type?: string;
  refundId?: string;
  isUiCallbackProcessed?: boolean;
  paymentInstrument?: Record<string, unknown>;
  isApplicationFeeProcessed?: boolean;
  gatewayOrderId?: string;
  plan?: 'basic' | 'pro';
}

export const paymentTransactionRepository = {
  async findOne(query: any): Promise<IPaymentTransactionDoc | null> {
    return PaymentTransaction.findOne(query).exec();
  },

  async create(data: CreatePaymentTransactionInput): Promise<IPaymentTransactionDoc> {
    const doc = new PaymentTransaction({
      ...data,
      userId: data.userId ? new mongoose.Types.ObjectId(data.userId) : undefined,
      refundId: data.refundId ? new mongoose.Types.ObjectId(data.refundId) : undefined,
    });
    await doc.save();
    return doc;
  },

  async findById(id: string): Promise<IPaymentTransactionDoc | null> {
    return PaymentTransaction.findById(id).exec();
  },

  async findByMerchantTransactionId(merchantTransactionId: string): Promise<IPaymentTransactionDoc | null> {
    return PaymentTransaction.findOne({ merchantTransactionId, isDeleted: false }).exec();
  },

  async findByUserId(userId: string, limit = 50): Promise<PaymentTransactionDto[]> {
    const docs = await PaymentTransaction.find({ userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
    return docs.map((d) => toDto(d as unknown as IPaymentTransactionDoc));
  },

  async updateById(
    id: string,
    update: Partial<CreatePaymentTransactionInput>
  ): Promise<IPaymentTransactionDoc | null> {
    return PaymentTransaction.findByIdAndUpdate(id, { $set: update }, { new: true }).exec();
  },

  toDto,
};
