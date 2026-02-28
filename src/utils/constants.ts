export const PAYMENT_STATUS = {
  paymentIntiated: 'PAYMENT_INITIATED',
  paymentSuccess: 'PAYMENT_SUCCESS',
  paymentPending: 'PAYMENT_PENDING',
  paymentDeclined: 'PAYMENT_DECLINED',
  timeOut: 'TIMED_OUT',
  paymentError: 'PAYMENT_ERROR',
  refundInitiated: 'REFUND_INITIATED',
  pendingFailed: 'PENDING_FAILED',
  failed: 'FAILED',
} as const;

export const PAYMENT_FAILED_STATUS = [
  'PAYMENT_ERROR',
  'TIMED_OUT',
  'PAYMENT_DECLINED',
  'FAILED',
] as const;

export const TRANSACTION_TYPE = {
  refund: 'refund',
  payment: 'payment',
} as const;

export const MEMBERSHIP_PLANS: Record<
  'basic' | 'pro',
  { amount: number }
> = {
  basic: { amount: 999 },
  pro: { amount: 2499 },
};
