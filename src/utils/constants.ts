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
  'TRANSACTION_NOT_FOUND'
] as const;

export const TRANSACTION_TYPE = {
  refund: 'refund',
  payment: 'payment',
} as const;

export const MEMBERSHIP_PLANS: Record<
  'basic' | 'pro',
  { amount: number, gst: number, totalAmount: number, planName: 'basic' | 'pro' }
> = {
  basic: { amount: 1999, gst: 359.82, totalAmount: 2358.82, planName: 'basic' },
  pro: { amount: 4999, gst: 899.82, totalAmount: 5898.82, planName: 'pro' },
};

export const CHECK_PAYMENT_STATUS_RECONCILIATION_INTERVALS = [
  { interval: 3000, duration: 30000 },
  { interval: 6000, duration: 60000 },
  { interval: 10000, duration: 60000 },
  { interval: 30000, duration: 60000 },
  { interval: 60000, duration: 1500000 }, // 25 minutes timeout
];

export const CHECK_PAYMENT_STATUS_WAIT_TIME = 25000