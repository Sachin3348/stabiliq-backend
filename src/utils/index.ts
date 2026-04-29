export * from './response';
import crypto from "crypto";
import momentTimezone from "moment-timezone";
import { MEMBERSHIP_PLANS } from './constants';

export function generateTransactionId(): string {
    const timestamp = Date.now();
    const randomString = Array.from({ length: 6 }, () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return characters.charAt(Math.floor(Math.random() * characters.length));
    }).join('');

    const transactionId = `T${timestamp}${randomString}`;
    return transactionId;
}

export function convertJsonToBase64(jsonData: Record<string, unknown>): string {
    if(!jsonData){
        throw new Error('Invalid JSON Data')
    }
    const data = JSON.stringify(jsonData)
    return Buffer.from(data).toString('base64')
}

export function calculateChecksum({payload='', apiEndpoint='', saltKey='', saltKeyIndex}: {payload: string, apiEndpoint: string, saltKey: string | undefined, saltKeyIndex: string | undefined}): string {
    const str = payload + apiEndpoint + saltKey;
    const sha256 = crypto.createHash('sha256').update(str).digest('hex');
    const checksum = sha256 + '###' + saltKeyIndex;
    return checksum
}

const convertJsonStrToJson = (jsonStr : string) =>{
    try {
        if(!jsonStr) return null
        return JSON.parse(jsonStr)
    } catch (error) {
        return null
    }
}

export function base64StrToJson(base64Str: string){
    try {
        if(!base64Str) return null
        const decodedJsonString = Buffer.from(base64Str, 'base64').toString()
        const jsonValue = convertJsonStrToJson(decodedJsonString)
        return jsonValue
    } catch (error) {
        return null
    }
}


export function timeStampToDateAndTimeWithSeconds(dateAndTime: string | number,format?: string){
    return momentTimezone(dateAndTime).tz('Asia/Calcutta').format(format);
}

export async function delay(delayTime: number){
    return new Promise((resolve) => setTimeout(resolve, delayTime));
}

export function getPlan(amount: number): 'basic' | 'pro' | undefined{
    if(amount === MEMBERSHIP_PLANS.basic.totalAmount){
        return MEMBERSHIP_PLANS.basic.planName
    }else if(amount === MEMBERSHIP_PLANS.pro.totalAmount){
        return MEMBERSHIP_PLANS.pro.planName
    }else{
        return undefined
    }
}