import mongoose from 'mongoose';
import { paymentTransactionRepository } from '../repository/paymentTransactionRepository';
import { userRepository } from '../repository/userRepository';
import { PAYMENT_STATUS, TRANSACTION_TYPE, type PaymentTransactionDto, type ValidateAndInitiatePaymentAtPhonePeResponse } from '../types/payment';
import type { JwtPayload } from '../types/auth';
import { AppError } from '../middlewares/AppError';
import { validateAndInitiatePaymentAtPhonePe } from './phonepePaymentService';
import { calculateChecksum, convertJsonToBase64, delay, generateTransactionId, getPlan, timeStampToDateAndTimeWithSeconds } from '../utils';
import { CHECK_PAYMENT_STATUS_RECONCILIATION_INTERVALS, CHECK_PAYMENT_STATUS_WAIT_TIME, PAYMENT_FAILED_STATUS } from '../utils/constants';
import axios from 'axios';
// const { sse } = require("../server");

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
async function isTransactionIdUnique(merchantTransactionId: string): Promise<boolean> {
    const existingTransaction = await paymentTransactionRepository.findOne({ merchantTransactionId });
    return !existingTransaction;
}

async function generateUniqueTransactionId(): Promise<string> {
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

export const paymentService = {
  async create(data: CreateTransactionInput): Promise<ValidateAndInitiatePaymentAtPhonePeResponse> {
    const userDetails = await userRepository.findOne({ _id: data.userId, isActive: true });
    if(!userDetails){
      return {status: false, message: "User not found"}
    }
    if(userDetails.plan){
        return {status: false, message: "User already has an active plan"}
    }
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

  async handleUserPaymentCompletion(transactionId: string, activity: string){
    const transaction = await paymentTransactionRepository.findOne({merchantTransactionId: transactionId}, {userId: true })
    if(!transaction){
        console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | merchantTransactionId: ${transaction} doesn't exist`)
        return {status: false, code: 404, message: "Transaction doesn't exist."}
    }
    if(transaction.isUiCallbackProcessed){
        console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | UI callback is already processed for merchantTransactionId ${transactionId}`, {transaction: JSON.stringify(transaction)})
        return {status: false, code: 400, message: "Bad Request"}
    }
    await paymentTransactionRepository.findOneAndUpdate({merchantTransactionId: transactionId},{$set: {isUiCallbackProcessed: true}})

    let merchantId = process.env.PST_PHONEPE_MERCHANT_ID || ''
    let saltKey = process.env.PST_PHONEPE_SALT_KEY || ''
    let saltKeyIndex = process.env.PST_SALT_KEY_INDEX || ''

    const {code, data, status, statusCode, message} = await checkPhonepePaymentStatus(transactionId, transaction.amount, String(transaction?.userId), merchantId, saltKey, saltKeyIndex)
    if(!status){
        console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | Error while processing payment completion for merchantTransactionId: ${transactionId} and userId: ${transaction?.userId}`, {code, data: JSON.stringify(data), statusCode, status})
        return {statusCode, status}
    }
    if(code === PAYMENT_STATUS.paymentSuccess){
        await paymentTransactionRepository.findOneAndUpdate({merchantTransactionId: transactionId}, {$set:{paymentStatus: PAYMENT_STATUS.paymentSuccess, ...(data?.data?.paymentInstrument &&{paymentInstrument: data?.data?.paymentInstrument})}})
        const {status, data: responseData, message} = await processPayment(String(transaction.userId), transactionId, merchantId, saltKey, saltKeyIndex, transaction.amount)
        return {status, data: responseData, message}
    }
    if(code === PAYMENT_STATUS.paymentPending){
        await paymentTransactionRepository.findOneAndUpdate({merchantTransactionId: transactionId}, {$set:{ paymentStatus: code, ...(data?.data?.paymentInstrument &&{paymentInstrument: data?.data?.paymentInstrument})}})
        checkAndUpdateAfter25Seconds(transactionId, transaction.amount, String(transaction.userId), merchantId, saltKey, saltKeyIndex)
        return {status: true, code: 200}
    }
    if(PAYMENT_FAILED_STATUS.includes(code as typeof PAYMENT_FAILED_STATUS[number])){
        await paymentTransactionRepository.findOneAndUpdate({merchantTransactionId: transactionId}, {$set:{ paymentStatus: code, ...(data?.data?.paymentInstrument &&{paymentInstrument: data?.data?.paymentInstrument})}})
        return {status: true, message: "Your payment has failed. Please try again", code: 200, isErrorForUser: true}
    }
    console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | Error while handling user payment completion with message:  got unexpected code: ${code} in check status api`, JSON.stringify({code, data, status, statusCode, message, transaction}))
    // const attributes = [process.env.SERVICE_ENVIRONMENT, timeStampToDateAndTimeWithSeconds(Date.now()), (message || "got unexpected code in check status api"), (code), `FST Payment UI Callback request with merchantTransactionId: ${transactionId} and userId:${transaction.userId}`]
    // sendErrorNotification({mobiles: JSON.parse(process.env.PHONEPE_PAYMENT_ERROR_NOTIFICATION_MOBILES || '[]'), attributes})
    return {status: false, message: "Error while processing payment completion. Please contact support if amount is deducted from your account.", code: statusCode, isErrorForUser: true}
  },
  //Phonepe Pay Server to Server Callback: https://developer.phonepe.com/v1/reference/server-to-server-callback-5
//This APi is called by PhonpePe Server when payment reaches to a terminal state (success/failed)
    async processPaymentS2SCallback ({code, data, activity}: {code: string, data: any, activity: string}){
        const {merchantTransactionId, transactionId, amount, merchantId} = data

        let saltKey = process.env.PST_PHONEPE_SALT_KEY
        let saltKeyIndex = process.env.PST_SALT_KEY_INDEX

        const transaction = await paymentTransactionRepository.findOne({merchantTransactionId, amount, merchantId, type: TRANSACTION_TYPE.payment})
        if(!transaction){
            console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | transaction not found for merchantTransactionId: ${merchantTransactionId}`, {data, code})
            return {status: false, message: `transaction not found for merchantTransactionId: ${merchantTransactionId}`, statusCode: 404}
        }
        const paymentStatus = await checkPhonepePaymentStatus(merchantTransactionId, amount, String(transaction?.userId), merchantId, saltKey!, saltKeyIndex!)
        if(code !== paymentStatus?.code){
            console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | Invalid S2S payment callback for merchantTransactionId: ${merchantTransactionId}. code not matching with check status api response`, {s2sRecievedCode: code, s2sReceivedData: JSON.stringify(data), checkStatusResponse: JSON.stringify(paymentStatus)}, {transaction})
            return {status: false, message: `Invalid S2S payment callback for merchantTransactionId: ${merchantTransactionId} and userId: ${transaction.userId}. S2S response code: ${code} not matching with check status api response code: ${paymentStatus?.code}.`, statusCode: 400}
        }
        const updateData = {
            phonepeTransactionId: transactionId,
            ...(data?.data?.paymentInstrument &&{paymentInstrument: data?.data?.paymentInstrument})
        }
        if(code === PAYMENT_STATUS.paymentSuccess){
            await processPayment(String(transaction.userId), merchantTransactionId, merchantId, saltKey!, saltKeyIndex!, transaction.amount)
            updateData.paymentStatus = code
        }
        if(PAYMENT_FAILED_STATUS.includes(code as typeof PAYMENT_FAILED_STATUS[number])){
            updateData.paymentStatus = code
        }

        await paymentTransactionRepository.findOneAndUpdate({merchantTransactionId}, {$set:updateData})
        return {status: true, message: "Transaction updated successfully"}
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



//PhonePe Check Status API: https://developer.phonepe.com/v1/reference/check-status-api-1
async function checkPhonepePaymentStatus(merchantTransactionId: string, amount: number, userId: string, merchantId: string, saltKey: string, saltKeyIndex: string, category: string = "membership_fee"): Promise<{status: boolean, code: string, data?: any, statusCode?: number, message?: string}>{
  const activity = "Check Payment Status"
  try {
      console.log(`${activity} | Start | ${timeStampToDateAndTimeWithSeconds(Date.now())} | making api call to check payment status of merchantTransactionId: ${merchantTransactionId}, amount: ${amount}, category: ${category} and userId: ${userId}`)
      const transaction = await paymentTransactionRepository.findOne({merchantTransactionId})
      if(!transaction){
          return {status: false, code: "TRANSACTION_NOT_FOUND", statusCode: 404, message: "Transaction Not found"}
      }

      const checksum = calculateChecksum({payload: '', apiEndpoint: `/pg/v1/status/${merchantId}/${merchantTransactionId}`, saltKey, saltKeyIndex})
      console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | merchantTransactionId: ${merchantTransactionId}, amount: ${amount}, category: ${category} and userId: ${userId} check status api header checksum: ${checksum}`)
      const options = {
      method: 'GET',
      url: `${process.env.PHONEPE_PG_HOST_URL}/pg/v1/status/${merchantId}/${merchantTransactionId}`,
      headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': merchantId
      }
      };
      const response = await axios.request(options)
      console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | End | payment status response for merchantTransactionId ${merchantTransactionId}, amount: ${amount}, category: ${category}  and userId: ${userId} :`, JSON.stringify(response.data))
      const { code, data={}, success} = response?.data || {}
      if(amount != data.amount){
          console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | amount received in status api and amount in db is not matching for merchantTransactionId ${merchantTransactionId}, amount: ${amount}, category: ${category}  and userId: ${userId}`, {checkStatusApiResData: JSON.stringify(data)})
          return {status: false, code, data: response.data, statusCode:400, message: "Amount received in status api and amount in db is not matching."}
      }
      if(code === PAYMENT_STATUS.paymentSuccess){
          return {status: true, code, data: response.data, statusCode:200}
      }
      if(code === PAYMENT_STATUS.paymentPending){
          return {status: true, code, data: response.data, statusCode:200}
      }
      if(PAYMENT_FAILED_STATUS.includes(code)){
          return {status: true, code, message: "Your payment is failed, please try again.", data: response.data}
      }
      return {code, data: response.data, status: success, statusCode:400}
  } catch (error: any) {
      // const attributes = [process.env.SERVICE_ENVIRONMENT, timeStampToDateAndTimeWithSeconds(Date.now()), error?.response?.data?.message || error?.message, error?.response?.status || 500 , `status check of FST Payment merchantTransactionId: ${merchantTransactionId}, amount: ${amount}, category: ${category} and userId ${userId}`]
      // sendErrorNotification({mobiles: JSON.parse(process.env.PHONEPE_PAYMENT_ERROR_NOTIFICATION_MOBILES || '[]'), attributes})

      console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | Error while checking status of merchantTransactionId ${merchantTransactionId}, amount: ${amount}, category: ${category} and userId: ${userId} with error code: ${error?.response?.data?.code} and error message: ${error?.response?.data?.message || error?.message}`, {errorResponseData: JSON.stringify(error?.response?.data)}, JSON.stringify(error))
      return({status: false, message: error?.response?.data?.message || error?.message, statusCode: error?.response?.status || 500, code: error?.response?.data?.code})
  }
}


async function checkAndUpdateAfter25Seconds(transactionId: string, amount: number, userId: string, merchantId: string, saltKey: string, saltKeyIndex: string, category: string = "membership_fee"){
  const activity = "Checking Payement Status After 25 Seccond"
  try {
      await delay(CHECK_PAYMENT_STATUS_WAIT_TIME)
      const {code, data, status, statusCode, message} = await checkPhonepePaymentStatus(transactionId, amount, userId, category, merchantId, saltKey, saltKeyIndex)
      if(!status){
          console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | Error while processing payment completion for merchantTransactionId: ${transactionId}, amount: ${amount}, category: ${category} and userId: ${userId}`, {code, data: JSON.stringify(data), statusCode, status})
          return {statusCode, status}
      }
      if(code === PAYMENT_STATUS.paymentSuccess){
          await paymentTransactionRepository.findOneAndUpdate({merchantTransactionId: transactionId}, {$set: { paymentStatus: PAYMENT_STATUS.paymentSuccess, ...(data?.data?.paymentInstrument &&{paymentInstrument: data?.data?.paymentInstrument})}})
          const {status, data: responseData, message} = await processPayment(userId, transactionId, merchantId, saltKey, saltKeyIndex,amount)
        //   sse.send({userId: userId?._id}, "check_status")
          return {status, data: responseData, message}
      }
      if(code === PAYMENT_STATUS.paymentPending){
          await paymentTransactionRepository.findOneAndUpdate({merchantTransactionId: transactionId}, {$set:{ paymentStatus: PAYMENT_STATUS.pendingFailed, ...(data?.data?.paymentInstrument &&{paymentInstrument: data?.data?.paymentInstrument})}})
          // sse.send({userId: userId?._id}, "check_status")
          pendingPaymentReconciliationProcess(transactionId, amount, userId, category, merchantId, saltKey, saltKeyIndex)
          return {status: true, code: 200}
      }
      if(PAYMENT_FAILED_STATUS.includes(code as typeof PAYMENT_FAILED_STATUS[number])){ 
          await paymentTransactionRepository.findOneAndUpdate({merchantTransactionId: transactionId}, {$set: { paymentStatus: code,  ...(data?.data?.paymentInstrument && {paymentInstrument: data?.data?.paymentInstrument})}})
          // sse.send({userId: userId?._id}, "check_status")
          return {status: true, message: "Your payment has failed. Please try again", code: 200}
      }

      console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | Error while checking payment status for merchantTransactionId: ${transactionId}, amount: ${amount}, category: ${category} and userId: ${userId} with message: got unexpected code: ${code} in check status api`, JSON.stringify({code, data, status, statusCode, message, transactionId, userId, amount}))
      // const attributes = [process.env.SERVICE_ENVIRONMENT, timeStampToDateAndTimeWithSeconds(Date.now()), (message || "got unexpected code in check status api"), (code), `FST Payment UI Callback request with merchantTransactionId: ${transactionId}, amount: ${amount}, category: ${category} and userId:${userId}`]
      // sendErrorNotification({mobiles: JSON.parse(process.env.PHONEPE_PAYMENT_ERROR_NOTIFICATION_MOBILES || '[]'), attributes})
      return {status: false}
  } catch (error: any) {
      console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | Error while handling user payment completion with message: ${error?.response?.data?.message || error?.message}`, JSON.stringify(error), {transactionId, amount, userId})
      // const attributes = [process.env.SERVICE_ENVIRONMENT, timeStampToDateAndTimeWithSeconds(Date.now()), (error?.response?.data?.message || error?.message), (error?.response?.status || 500), `FST Payment UI Callback request with merchantTransactionId: ${transactionId}, userId: ${userId}, category: ${category} and amount is ${amount}`]
      // sendErrorNotification({mobiles: JSON.parse(process.env.PHONEPE_PAYMENT_ERROR_NOTIFICATION_MOBILES || '[]'), attributes})
      return {status: false, code: error?.response?.status || 500, message: error?.response?.data?.message || error?.message }
  }
}

//updates leads payment status and related field in db and zoho on payment success
async function processPayment(userId: string, merchantTransactionId: string, merchantId: string, saltKey: string, saltKeyIndex: string,amount: number){
  const activity = "Processing FST Lead application fee payment"
  console.log(`${activity} | Start | Processing application fee payment for userId: ${userId}, merchantTransactionId: ${merchantTransactionId}`)

const transactionDetails = await paymentTransactionRepository.findOneAndUpdate({merchantTransactionId, merchantId, type: TRANSACTION_TYPE.payment}, {isPaymentProcessed: true}, false)

  if(!transactionDetails){
      console.log(`${activity} | Transaction not found for merchantTransactionId ${merchantTransactionId}`, {userId, merchantTransactionId, merchantId, saltKey, saltKeyIndex,amount})
      return {status: true, message: `Transaction not found for merchantTransactionId ${merchantTransactionId}`}
  }

  if(transactionDetails.isPaymentProcessed){
      return {status: true, message: "lead application fee payment processed successfully."}
  }

  const lead = await userRepository.findOne({_id: userId, isActive:true})

  if(!lead){
      console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | lead not found`, {userId})
      return { status: false, message:"Lead Not Found.", code: 404}
  }

  if(lead.plan){
      console.log(`${activity} | Lead has already paid application fee. Initiating refund for merchantTransactionId: ${merchantTransactionId}`,
       {merchantTransactionId, leadName: lead.name, mobile:lead.phone})
      const {status, message, data: refundResponseData} = await initiateRefund(merchantTransactionId, merchantId, saltKey, saltKeyIndex)
      console.log(`${activity} | Initiated refund for merchantTransactionId: ${merchantTransactionId}`, {status, message, refundResponseData, userId})
      await paymentTransactionRepository.findOneAndUpdate({merchantTransactionId}, {$set:{paymentStatus: PAYMENT_STATUS.refundInitiated, refundId: refundResponseData?._id}})
      // const attributes = [process.env.SERVICE_ENVIRONMENT, timeStampToDateAndTimeWithSeconds(Date.now()), `userId: ${userId}, mobile: ${lead.phone} has already paid application fee. Initiating refund for merchantTransactionId: ${merchantTransactionId}.`, 400, `processing lead aplication fee`]
      // sendErrorNotification({mobiles: JSON.parse(process.env.PHONEPE_PAYMENT_ERROR_NOTIFICATION_MOBILES || '[]'), attributes})
      return {status:false, message: `Your application fee is already paid. We have initiated refund for this payment.`, isErrorForUser: true}
  }
  const updateDetails = {
      $set:{
          plan: getPlan(amount/100),
      }
  }
  const a = await userRepository.findOneAndUpdate({_id: userId, isActive : true}, updateDetails)

  console.log(`${activity} | End | Processing application fee payment for userId: ${userId}, merchantTransactionId: ${merchantTransactionId}`)

  
  return {status: true, message: "lead application fee payment processed successfully.", data: {}}
}


//This function is called from checkAndUpdateAfter25Seconds if payment status is still pending after 25 seconds.
//It runs asynchronously and check payment status in specified intervals till payment status reach to a terminal state (success/failed)
//updates the transaction and initiates refund in case of payment is success
async function pendingPaymentReconciliationProcess(transactionId: string, amount: number, userId: string, category: string, merchantId: string, saltKey: string, saltKeyIndex: string){
    const activity = "Checking Pending Payment Status in Reconciliation"
    try {
        for(let i = 0; i< CHECK_PAYMENT_STATUS_RECONCILIATION_INTERVALS.length; i++){
            let {interval, duration} = CHECK_PAYMENT_STATUS_RECONCILIATION_INTERVALS[i]
            while(duration > 0){
                await delay(interval)
                const {code, data, status, statusCode} = await checkPhonepePaymentStatus(transactionId, amount, userId, category, merchantId, saltKey, saltKeyIndex)
                if(!status){
                    console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | Error while checking status of pending payment in reconciliation process with merchantTransactionId: ${transactionId}, amount: ${amount}, category: ${category} and userId: ${userId}`, {code, data: JSON.stringify(data), statusCode, status})
                    // const attributes = [process.env.SERVICE_ENVIRONMENT, timeStampToDateAndTimeWithSeconds(Date.now()), message, (statusCode || 400), `reconciliation process to check status of FST phonepe merchantTransactionId: ${transactionId}, userId: ${userId}, category: ${category} and amount is ${amount}`]
                    // sendErrorNotification({mobiles: JSON.parse(process.env.PHONEPE_PAYMENT_ERROR_NOTIFICATION_MOBILES || '[]'), attributes})
                    return {statusCode, status}
                }
                if(code === PAYMENT_STATUS.paymentSuccess){
                    //initiating refund on transaction is success
                    console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | Initiating refund for a pending-failed merchantTransactionId: ${transactionId}, userId: ${userId}, category: ${category} and amount: ${amount}`)
                    const {status, message, data: refundResponseData} = await initiateRefund(transactionId, merchantId, saltKey, saltKeyIndex)
                    console.log(`${activity} | Initiated refund for merchantTransactionId: ${transactionId}`, {status, message, refundResponseData, userId, category})

                    await paymentTransactionRepository.findOneAndUpdate({merchantTransactionId: transactionId}, {$set:{paymentStatus: PAYMENT_STATUS.refundInitiated, refundId: refundResponseData?._id, ...(data?.data?.paymentInstrument &&{paymentInstrument: data?.data?.paymentInstrument})}})
                    return {status, data:refundResponseData, message}
                }
                if(PAYMENT_FAILED_STATUS.includes(code as typeof PAYMENT_FAILED_STATUS[number])){
                    await paymentTransactionRepository.findOneAndUpdate({merchantTransactionId: transactionId}, {$set:{paymentStatus: code, ...(data?.data?.paymentInstrument &&{paymentInstrument: data?.data?.paymentInstrument})}})
                    return {status: false, message: "Your payment has failed. Please try again", code: 200}
                }
                duration = duration - interval
            }
        }  
        console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | Error while checking status of pending payment in reconciliation process. merchantTransactionId: ${transactionId}, amount: ${amount}, category: ${category} and userId: ${userId}} doesn't reached to any terminal state in reconciliation process of 20 min `)
        // const attributes = [process.env.SERVICE_ENVIRONMENT, timeStampToDateAndTimeWithSeconds(Date.now()), `pending payment with merchantTransactionId: ${transactionId}, amount: ${amount}, category: ${category} and userId: ${userId}} doesn't reached to any terminal state in reconciliation process of 20 min`, 400, `reconciliation process to check FST pending payment status of merchantTransactionId: ${transactionId}, userId: ${userId} and amount is ${amount}`]
        // sendErrorNotification({mobiles: JSON.parse(process.env.PHONEPE_PAYMENT_ERROR_NOTIFICATION_MOBILES || '[]'), attributes})
        return
    } catch (error: any) {
        console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | Error while checking status of pending payment in reconciliation process with message: ${error?.response?.data?.message || error?.message}`, JSON.stringify(error), {transactionId, amount, userId, category})
        // const attributes = [process.env.SERVICE_ENVIRONMENT, timeStampToDateAndTimeWithSeconds(Date.now()), (error?.response?.data?.message || error?.message), (error?.response?.status || 500), `reconciliation process to check FST pending payment status of merchantTransactionId: ${transactionId}, userId: ${userId}, category: ${category} and amount is ${amount}`]
        // sendErrorNotification({mobiles: JSON.parse(process.env.PHONEPE_PAYMENT_ERROR_NOTIFICATION_MOBILES || '[]'), attributes})
        return { status: false, code: error?.response?.status || 500, message: error?.response?.data?.message || error?.message }
    }
}

//PhonePe Refund: https://developer.phonepe.com/v1/reference/refund-8
//Initiates a refund against a payment transaction
//Case 1: If payment is still in pending state after 25 secs of UI Callback and we informed user that it is failed (pending-failed)
//and payment reaches to success status in pendingPaymentReconciliationProcess
//Case 2: If user application fees is already paid
async function initiateRefund(transactionId: string, merchantId: string, saltKey: string, saltKeyIndex: string){
    const originalTransaction = await paymentTransactionRepository.findOne({merchantTransactionId: transactionId, type: TRANSACTION_TYPE.payment})
    const merchantTransactionId = await generateUniqueTransactionId();
    
    const payload = {
        "merchantId": merchantId,
        "merchantUserId": originalTransaction?.userId,
        "originalTransactionId":transactionId,
        "merchantTransactionId": merchantTransactionId,
        "amount": originalTransaction?.amount,
        "callbackUrl": `${process.env.STABILIQ_BACKEND_URL}/payment/refund`
    }
    const finalPayload = convertJsonToBase64(payload)
    const checksum = calculateChecksum({payload: finalPayload, apiEndpoint: '/pg/v1/refund', saltKey, saltKeyIndex})
    const options = {
        method: 'POST',
        url: `${process.env.PHONEPE_PG_HOST_URL}/pg/v1/refund`,
        headers:{
            'Content-Type': "application/json",
            "X-VERIFY": checksum
        },
        data: {
            request: finalPayload
        }
    }
    const refundResponse = await axios.request(options)
    console.log(`Refund Initiated for userId: ${originalTransaction?.userId}, originalMerchantTransactionId: ${originalTransaction?.merchantTransactionId} with response:`, JSON.stringify(refundResponse.data))
    const {code, data, success, message} = refundResponse.data
    if(!success){
        return {status: false, statusCode: 400, message}
    }
    const refundData = {
        merchantTransactionId,
        type: TRANSACTION_TYPE.refund,
        merchantId: merchantId,
        userId: String(originalTransaction?.userId),
        amount:data.amount ,
        paymentStatus: code,
        phonepeTransactionId: data.transactionId
    }

    const refundDetails = await paymentTransactionRepository.create(refundData)
    return {status: true, message, data: refundDetails}

}