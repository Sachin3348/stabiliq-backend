import mongoose from 'mongoose';
import { paymentTransactionRepository } from '../repository/paymentTransactionRepository';
import { userRepository } from '../repository/userRepository';
import type { PaymentTransactionDto, ValidateAndInitiatePaymentAtPhonePeResponse } from '../types/payment';
import type { JwtPayload } from '../types/auth';
import { AppError } from '../middlewares/AppError';
import { validateAndInitiatePaymentAtPhonePe } from './phonepePaymentService';

export interface CreateTransactionInput {
  merchantTransactionId?: string;
  merchantId?: string;
  totalAmount: number;
  userId: string;
  amount: number;
  phonepeTransactionId?: string;
  paymentStatus?: string;
  type?: string;
  gatewayOrderId?: string;
  plan?: 'basic' | 'pro';
  paymentInstrument?: Record<string, unknown>;
  mobile: string;
}

export const paymentService = {
  async create(data: CreateTransactionInput): Promise<ValidateAndInitiatePaymentAtPhonePeResponse> {
    const result = await validateAndInitiatePaymentAtPhonePe({amount: data.amount, userId: data.userId, mobile: data.mobile});
    if(!result.status){
      throw new AppError(result.message || 'Error while initiating payment request', 400);
    }
    return {
      status: result.status,
      checkoutPageUrl: result.checkoutPageUrl,
      message: result.message,
    };
  },

  async getById(id: string): Promise<PaymentTransactionDto | null> {
    const doc = await paymentTransactionRepository.findById(id);
    return doc ? paymentTransactionRepository.toDto(doc) : null;
  },

  async getByMerchantTransactionId(merchantTransactionId: string): Promise<PaymentTransactionDto | null> {
    const doc = await paymentTransactionRepository.findByMerchantTransactionId(merchantTransactionId);
    return doc ? paymentTransactionRepository.toDto(doc) : null;
  },

  async getMyTransactions(payload: JwtPayload, limit?: number): Promise<PaymentTransactionDto[]> {
    const userDoc = await userRepository.findByEmail(payload.sub);
    if (!userDoc) throw new AppError('User not found', 404);
    const userId = (userDoc as mongoose.Document)._id?.toString();
    if (!userId) throw new AppError('User not found', 404);
    return paymentTransactionRepository.findByUserId(userId, limit);
  },

  async updateTransaction(
    id: string,
    update: Partial<CreateTransactionInput>
  ): Promise<PaymentTransactionDto | null> {
    const doc = await paymentTransactionRepository.updateById(id, update);
    return doc ? paymentTransactionRepository.toDto(doc) : null;
  },
};
