import crypto from 'crypto';
import axios from 'axios';
import { paymentTransactionRepository } from '../repository/paymentTransactionRepository';
import { PAYMENT_STATUS, TRANSACTION_TYPE } from '../types/payment';
import { generateTransactionId, timeStampToDateAndTimeWithSeconds } from '../utils';

const CASHFREE_API_VERSION = '2023-08-01';

// Cashfree order status → internal PAYMENT_STATUS mapping
const CASHFREE_STATUS_MAP: Record<string, string> = {
    PAID: PAYMENT_STATUS.paymentSuccess,
    ACTIVE: PAYMENT_STATUS.paymentPending,
    FAILED: PAYMENT_STATUS.failed,
    CANCELLED: PAYMENT_STATUS.failed,
    EXPIRED: PAYMENT_STATUS.failed,
    USER_DROPPED: PAYMENT_STATUS.failed,
};

async function isTransactionIdUnique(merchantTransactionId: string): Promise<boolean> {
    const existing = await paymentTransactionRepository.findOne({ merchantTransactionId });
    return !existing;
}

async function generateUniqueTransactionId(): Promise<string> {
    while (true) {
        const id = generateTransactionId();
        if (await isTransactionIdUnique(id)) return id;
    }
}

function cashfreeHeaders() {
    return {
        'Content-Type': 'application/json',
        'x-client-id': process.env.CASHFREE_CLIENT_ID || '',
        'x-client-secret': process.env.CASHFREE_CLIENT_SECRET || '',
        'x-api-version': CASHFREE_API_VERSION,
    };
}

export async function validateAndInitiatePaymentAtCashfree({ amount, userId, mobile, plan, redemptionId }: { amount: number; userId: string; mobile: string; plan?: 'basic' | 'pro'; redemptionId?: import('mongoose').Types.ObjectId }): Promise<{ status: boolean; paymentSessionId?:string; checkoutPageUrl?: string; message?: string; }> {
    const orderId = await generateUniqueTransactionId();
    const hostUrl = process.env.CASHFREE_PG_HOST_URL || 'https://sandbox.cashfree.com/pg';

    const payload = {
        order_id: orderId,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
            customer_id: userId,
            customer_phone: String(mobile),
        },
        order_meta: {
            return_url: `${process.env.STABILIQ_BACKEND_URL}/api/payment/cashfree/status?order_id={order_id}`,
            notify_url: `${process.env.STABILIQ_BACKEND_URL}/api/payment/cashfree/callback`,
        },
    };

    const response = await axios.post(`${hostUrl}/orders`, payload, { headers: cashfreeHeaders() });
    const { payment_session_id } = response.data || {};

    if (!payment_session_id) {
        console.log('Cashfree | Error initiating payment', { mobile, userId, amount }, JSON.stringify(response.data));
        return { status: false, message: 'Error while initiating payment request' };
    }

    // const checkoutBaseUrl = hostUrl.includes('sandbox')
    //     ? 'https://payments-test.cashfree.com/order'
    //     : 'https://payments.cashfree.com/order';

    // Cashfree hosted checkout: session_id goes as a hash fragment (no slash before #)
    const checkoutPageUrl = "";

    await paymentTransactionRepository.create({
        merchantTransactionId: orderId,
        gatewayOrderId: orderId,
        userId,
        amount,
        paymentStatus: PAYMENT_STATUS.paymentInitiated,
        type: TRANSACTION_TYPE.payment,
        gateway: 'cashfree',
        ...(plan && { plan }),
        ...(redemptionId && { redemptionId }),
    });

    console.log('Cashfree payment initiated', { mobile, userId, amount, orderId, payment_session_id });
    return { status: true, checkoutPageUrl, paymentSessionId: payment_session_id };
}

export async function checkCashfreePaymentStatus(orderId: string, amount: number, userId: string): Promise<{ status: boolean; code: string; data?: any; statusCode?: number; message?: string }> {
    const activity = 'Cashfree Check Payment Status';
    try {
        const hostUrl = process.env.CASHFREE_PG_HOST_URL || 'https://sandbox.cashfree.com/pg';
        console.log(`${activity} | Start | ${timeStampToDateAndTimeWithSeconds(Date.now())} | orderId: ${orderId}, amount: ${amount}, userId: ${userId}`);

        const response = await axios.get(`${hostUrl}/orders/${orderId}`, { headers: cashfreeHeaders() });
        const orderData = response.data || {};
        const cashfreeStatus: string = orderData.order_status || '';
        const code = CASHFREE_STATUS_MAP[cashfreeStatus] || PAYMENT_STATUS.failed;

        console.log(`${activity} | End | orderId: ${orderId} status: ${cashfreeStatus} → internal: ${code}`);

        if (orderData.order_amount !== undefined && Number(orderData.order_amount) !== Number(amount)) {
            console.log(`${activity} | Amount mismatch | orderId: ${orderId}`, { expected: amount, received: orderData.order_amount });
            return { status: false, code, data: orderData, statusCode: 400, message: 'Amount mismatch in status check' };
        }

        if (code === PAYMENT_STATUS.paymentSuccess) return { status: true, code, data: orderData, statusCode: 200 };
        if (code === PAYMENT_STATUS.paymentPending) return { status: true, code, data: orderData, statusCode: 200 };
        return { status: true, code, data: orderData, message: 'Payment failed or cancelled.' };
    } catch (error: any) {
        console.log(`${activity} | Error | orderId: ${orderId}`, error?.response?.data || error?.message);
        return { status: false, code: PAYMENT_STATUS.failed, message: error?.response?.data?.message || error?.message, statusCode: error?.response?.status || 500 };
    }
}

export async function initiateCashfreeRefund(transactionId: string): Promise<{ status: boolean; statusCode?: number; message: string; data?: any }> {
    try {
        const originalTransaction = await paymentTransactionRepository.findOne({ merchantTransactionId: transactionId, type: TRANSACTION_TYPE.payment });
        if (!originalTransaction) {
            return { status: false, statusCode: 404, message: 'Original transaction not found' };
        }

        const refundId = generateTransactionId();
        const hostUrl = process.env.CASHFREE_PG_HOST_URL || 'https://sandbox.cashfree.com/pg';

        const payload = {
            refund_amount: originalTransaction.amount,
            refund_id: refundId,
            refund_note: 'Duplicate or pending-failed payment refund',
        };

        const response = await axios.post(`${hostUrl}/orders/${transactionId}/refunds`, payload, { headers: cashfreeHeaders() });
        const {  refund_status } = response.data || {}; //cf_refund_id,

        console.log(`Cashfree refund initiated | orderId: ${transactionId}, refundId: ${refundId}`, JSON.stringify(response.data));

        const refundData = await paymentTransactionRepository.create({
            merchantTransactionId: refundId,
            type: TRANSACTION_TYPE.refund,
            userId: String(originalTransaction.userId),
            amount: originalTransaction.amount,
            paymentStatus: refund_status || 'REFUND_INITIATED',
            gatewayOrderId: transactionId,
            gateway: 'cashfree',
        });

        return { status: true, message: 'Refund initiated', data: refundData };
    } catch (error: any) {
        console.log('Cashfree initiate refund | Error', error?.response?.data || error?.message);
        return { status: false, statusCode: error?.response?.status || 500, message: error?.response?.data?.message || error?.message };
    }
}

export function verifyCashfreeWebhookSignature(rawBody: string, timestamp: string, signature: string): boolean {
    const secret = process.env.CASHFREE_CLIENT_SECRET || '';
    const data = timestamp + rawBody;
    const expected = crypto.createHmac('sha256', secret).update(data).digest('base64');
    return expected === signature;
}
