import { paymentTransactionRepository } from "../repository/paymentTransactionRepository";
import { PAYMENT_STATUS, TRANSACTION_TYPE } from "../types/payment";
import { calculateChecksum, convertJsonToBase64, generateTransactionId } from "../utils";
import axios from "axios";



async function isTransactionIdUnique(merchantTransactionId: string): Promise<boolean> {
    const existingTransaction = await paymentTransactionRepository.findOne({ merchantTransactionId });
    return !existingTransaction;
}

async function generateUniqueTransactionId() {
    while (true) {

        const newTransactionId = generateTransactionId();
        const isUnique = await isTransactionIdUnique(newTransactionId);

        if (isUnique) {
            return newTransactionId;
        } else {
            console.log(`Duplicate merchant transaction ID detected: ${newTransactionId}. Generating a new one.`);
        }
    }
}

//PhonpePe PAY API: https://developer.phonepe.com/v1/reference/pay-api-1/
//Initiate new transaction at PhonePe and returns the PhonePe checkout page url for payment
export async function validateAndInitiatePaymentAtPhonePe({amount, userId, mobile}: {amount: number, userId: string, mobile: string}): Promise<{status: boolean, checkoutPageUrl?: string, message?: string }> {
    const merchantTransactionId = await generateUniqueTransactionId();
    let merchantId = process.env.PST_PHONEPE_MERCHANT_ID
    let saltKey = process.env.PST_PHONEPE_SALT_KEY
    let saltKeyIndex = process.env.PST_SALT_KEY_INDEX

    const payload = {
        merchantId,
        merchantTransactionId,
        amount: Number(amount),
        merchantUserId: userId,
        redirectUrl: `${process.env.BASE_URL}/payment/status`,
        redirectMode: "POST",
        callbackUrl: `${process.env.BASE_URL}/payment/callback`,
        paymentInstrument: {
            type: 'PAY_PAGE'
        },
        mobileNumber: String(mobile)
    }
    
    const finalPayload = convertJsonToBase64(payload)
    const checksum = calculateChecksum({payload: finalPayload, apiEndpoint: '/pg/v1/pay', saltKey, saltKeyIndex})

    const options = {
        method: "POST",
        url: `${process.env.PHONEPE_PG_HOST_URL}/pg/v1/pay`,
        headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': checksum
        },
        data:{
            request: finalPayload
        }
    }
    const paymentRequestResponse = await axios.request(options)
    const checkoutPageUrl = paymentRequestResponse?.data?.data?.instrumentResponse?.redirectInfo?.url
    if(!checkoutPageUrl){
        console.log("Initiating payment | error while initiating payment request", {mobile, userId, amount}, JSON.stringify(paymentRequestResponse))
        return({status: false, message: "Error while initiating payment request"})
    }
    console.log(`Phonepe payment initiated successfully`, {mobile, userId, amount}, JSON.stringify(paymentRequestResponse?.data?.data))
    const transactionDetails = {
        merchantId,
        merchantTransactionId,
        userId: userId,
        amount: Number(amount),
        paymentStatus: PAYMENT_STATUS.paymentInitiated,
        type: TRANSACTION_TYPE.payment,
    }
    await paymentTransactionRepository.create(transactionDetails)
    return {status: true, checkoutPageUrl }
}