import { Request, Response } from 'express';
import { paymentService } from '../services/paymentService';
import { sendSuccess, sendError } from '../utils/response';
import { MEMBERSHIP_PLANS } from '../utils/constants';
import { base64StrToJson, timeStampToDateAndTimeWithSeconds } from '../utils';

export const paymentController = {
  async create(req: Request, res: Response) {
    try {
      const body = req.body as Parameters<typeof paymentService.create>[0];
      const result = await paymentService.create({
        ...body, 
        userId: String(req.user?.id) || '', 
        mobile: req.user?.mobile || '',
        amount: MEMBERSHIP_PLANS[body.plan as 'basic' | 'pro'].amount,
      });
      if(!result.status){
        return sendError(res, 400, result.message || "Error while initiating payment");
      }
      return sendSuccess(res, 201, result);

    } catch (err) {
        return sendError(res, err instanceof Error ? 400 : 500, err instanceof Error ? err.message : "Internal server error");
    }
  },

  async handleUserPaymentCompletion(_: Request, res: Response){
    const {checksum, transactionId, amount} = res?.req?.body || {}
    const redirectWebisteUrl = process.env.STABILIQ_FE_URL || 'https://stabiliq.in'
    const activity = `Phonepe UI Callback`
    // const loggingData = {
    //     activity:'handleUserPaymentCompletion',
    //     checksum,
    //     transactionId,
    //     amount
    // }
    try {
        // loggingService.logActivity(loggingData)
        console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | Start | Processing phonepe payment for merchantTransactionId: ${transactionId} and amount: ${amount}`)
        if(!checksum || !amount || !transactionId){
            console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | Response payload missing any of checksum, transactionId, amount field.`, {checksum, transactionId, amount, responseRequest: JSON.stringify(res?.req || {})})
            return res.status(400).send({status: 400, message: "Invalid request."})
        }
        const {} = await paymentService.handleUserPaymentCompletion(transactionId, activity)
        console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | End | Processing phonepe payment for merchantTransactionId: ${transactionId} and amount: ${amount}`)
        return res.redirect(`${redirectWebisteUrl}/payment-status`)
    } catch (error: any) {
        // loggingService.logError(error, loggingData)
        // const attributes = [process.env.SERVICE_ENVIRONMENT, timeStampToDateAndTimeWithSeconds(Date.now()), (error?.response?.data?.message || error?.message), (error?.response?.status || 500), `FST Payment UI Callback request with merchantTransactionId: ${transactionId} and amount is ${amount}`]
        // sendErrorNotification({mobiles: JSON.parse(process.env.PHONEPE_PAYMENT_ERROR_NOTIFICATION_MOBILES || '[]'), attributes})
        console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | Error while handling user payment completion with message: ${error?.response?.data?.message || error?.message}`, JSON.stringify(error), {merchantTransactionId:transactionId, amount})
        return res.redirect(`${redirectWebisteUrl}/payment-status`)
    }
},

  async handlePaymentCompletionCashfree(req: Request, res: Response){
    const {order_id:transactionId} = req.query || {}
    const redirectWebisteUrl = process.env.STABILIQ_FE_URL || 'https://stabiliq.in'
    const activity = `Cashfree UI Callback`
    // const loggingData = {
    //     activity:'handleUserPaymentCompletion',
    //     checksum,
    //     transactionId,
    //     amount
    // }
    try {
        // loggingService.logActivity(loggingData)
        console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | Start | Processing Cashfree payment for merchantTransactionId: ${transactionId}`)
        if(!transactionId){
            console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | Response payload missing any of checksum, transactionId, amount field.`, { transactionId})
            return res.status(400).send({status: 400, message: "Invalid request."})
        }
        const {} = await paymentService.handleUserPaymentCompletion(String(transactionId), activity)
        console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | End | Processing Cashfree payment for merchantTransactionId: ${transactionId}`)
        return res.redirect(`${redirectWebisteUrl}/payment-status`)
    } catch (error: any) {
        // loggingService.logError(error, loggingData)
        // const attributes = [process.env.SERVICE_ENVIRONMENT, timeStampToDateAndTimeWithSeconds(Date.now()), (error?.response?.data?.message || error?.message), (error?.response?.status || 500), `FST Payment UI Callback request with merchantTransactionId: ${transactionId} and amount is ${amount}`]
        // sendErrorNotification({mobiles: JSON.parse(process.env.Cashfree_PAYMENT_ERROR_NOTIFICATION_MOBILES || '[]'), attributes})
        console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | Error while handling user payment completion with message: ${error?.response?.data?.message || error?.message}`, JSON.stringify(error), {merchantTransactionId:transactionId})
        return res.redirect(`${redirectWebisteUrl}/payment-status`)
    }
},


async processPaymentS2SCallback(req: Request, res: Response){
    const activity = "Phonepe Payment S2S Callback"
    const {response=null} = req?.body || {}
    const {code, data} = base64StrToJson(response) || {}
    // const loggingData = {
    //     activity:'processPaymentS2SCallback',
    //     response,
    //     data,
    //     code
    // }
    try {
        // loggingService.logActivity(loggingData)
        console.log(`S2S payment callback recieved for merchantTransactionId: ${data?.merchantTransactionId} :`, req?.body )
        if(!response){
            console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | request payload is invalid`, req.body)
            return res.status(400).send({status: false, message: 'request payload is invalid'})
        }
        if(!code || !data || !data?.merchantTransactionId){
            console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | payload should contain code, merchantTransactionId and data`, {payload: base64StrToJson(response)})
            return res.status(400).send({status: false, message: "Invalid request"})
        }

        const {status, statusCode}= await paymentService.processPaymentS2SCallback({code, data, activity})
        if(!status){
            // const attributes = [process.env.SERVICE_ENVIRONMENT, timeStampToDateAndTimeWithSeconds(Date.now()), message, 400, `S2S payment callback for FST PhonePe merchantTransactionId: ${data?.merchantTransactionId}`]
            // sendErrorNotification({mobiles: JSON.parse(process.env.PHONEPE_PAYMENT_ERROR_NOTIFICATION_MOBILES || '[]'), attributes})
            return res.status(statusCode || 400).send({status})
        }
        return res.status(statusCode || 200).send({status: true})

    } catch (error: any) {
        // loggingService.logError(error, loggingData)
        console.log(`${activity} | ${timeStampToDateAndTimeWithSeconds(Date.now())} | Error while processing payment S2S callback for merchantTransactionId: ${data?.merchantTransactionId} with message: ${error?.response?.data?.message || error.message}`, {code, data: JSON.stringify(data)})
        // const attributes = [process.env.SERVICE_ENVIRONMENT, timeStampToDateAndTimeWithSeconds(Date.now()), ` ${error?.response?.data?.message || error.message}`, 400, `S2S payment callback for FST PhonePe merchantTransactionId: ${data?.merchantTransactionId}`]
        // sendErrorNotification({mobiles: JSON.parse(process.env.PHONEPE_PAYMENT_ERROR_NOTIFICATION_MOBILES || '[]'), attributes})
        return res.status(error.statusCode || 500).send({status: false, message: "INTERNAL_SEVER_ERROR"})
    }
},
    async getLastPaymentStatus(req: Request, res: Response){
    const {id: userId} = req.user || {}
    const activity =`Get Last Payment Status`
    // let loggingData = {
    //     activity: "getLastPaymentStatus",   
    //     userId
    // }
    try {
        // loggingService.logActivity(loggingData)
        if(!userId){
            console.log(`${activity} | userId is mandatory`, {userId})
            return res.status(400).send({status: false, message: "lead details is mandatory"})
        }
        const {status, message, statusCode, data, isErrorForUser=false} = await paymentService.getLastPaymentStatus(String(userId), activity)
        return res.status(statusCode || 200).send({status, ...(message && {message}), ...(data && {data}), isErrorForUser})
    } catch (error: any) {
        // loggingService.logError(error, loggingData)
        console.log(`${activity} | Error while checking last user payment status of userId: ${userId} with message: ${error?.response?.data?.message || error?.message}`, JSON.stringify(error))
        return res.status(error?.statusCode || 500).send({status: false, message: "Something went wrong, please try again later."})
    }
}
};
