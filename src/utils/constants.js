export const PAYMENT_STATUS = {
    paymentIntiated: "PAYMENT_INITIATED",
    paymentSuccess: "PAYMENT_SUCCESS",
    paymentPending: "PAYMENT_PENDING",
    paymentDeclined: "PAYMENT_DECLINED",
    timeOut: "TIMED_OUT",
    paymentError: "PAYMENT_ERROR",
    refundInitiated: "REFUND_INITIATED",
    pendingFailed: "PENDING_FAILED",
    failed: "FAILED"
    };
    
export const PAYMENT_FAILED_STATUS = ["PAYMENT_ERROR", "TIMED_OUT", "PAYMENT_DECLINED", "FAILED"]

export const TRANSACTION_TYPE = {
    refund: "refund",
    payment: "payment"
}