export * from './response';
import crypto from "crypto";

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

