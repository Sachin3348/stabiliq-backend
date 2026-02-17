/** Payment status values (match backend enum) */
export const PAYMENT_STATUS = {
  paymentInitiated: 'PAYMENT_INITIATED',
  paymentSuccess: 'PAYMENT_SUCCESS',
  paymentPending: 'PAYMENT_PENDING',
  paymentDeclined: 'PAYMENT_DECLINED',
  timeOut: 'TIMED_OUT',
  paymentError: 'PAYMENT_ERROR',
  refundInitiated: 'REFUND_INITIATED',
  pendingFailed: 'PENDING_FAILED',
  failed: 'FAILED',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_FAILED_STATUSES: PaymentStatus[] = [
  'PAYMENT_ERROR',
  'TIMED_OUT',
  'PAYMENT_DECLINED',
  'FAILED',
];

/** Transaction type */
export const TRANSACTION_TYPE = {
  refund: 'refund',
  payment: 'payment',
} as const;

export type TransactionType = (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];

/** Payment transaction as returned in API responses */
export interface PaymentTransactionDto {
  id: string;
  merchantTransactionId?: string;
  merchantId?: string;
  totalAmount?: number;
  userId?: string;
  amount?: number;
  phonepeTransactionId?: string;
  paymentStatus?: PaymentStatus;
  type?: TransactionType;
  refundId?: string;
  isUiCallbackProcessed?: boolean;
  paymentInstrument?: Record<string, unknown>;
  isDeleted?: boolean;
  isApplicationFeeProcessed?: boolean;
  gatewayOrderId?: string;
  plan?: 'basic' | 'pro';
  createdAt?: string;
  updatedAt?: string;
}

export interface ValidateAndInitiatePaymentAtPhonePeResponse {
  status: boolean;
  checkoutPageUrl?: string;
  message?: string;
}