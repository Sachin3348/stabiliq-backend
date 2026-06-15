import axios from 'axios';
import { env } from '../config/env';
import logger from './logger';

const AISENSY_API_URL = 'https://backend.aisensy.com/campaign/t1/api/v2';

export interface SendWhatsAppOtpResult {
  success: boolean;
  error?: string;
}

export function isAiSensyConfigured(): boolean {
  return !!(env.AISENSY_API_KEY && env.AISENSY_CAMPAIGN_NAME && env.AISENSY_USER_NAME);
}

export async function sendWhatsAppOtp(
  phone: string,
  otp: string,
  ttlMinutes: number,
): Promise<SendWhatsAppOtpResult> {
  try {
    await axios.post(
      AISENSY_API_URL,
      {
        apiKey: env.AISENSY_API_KEY,
        campaignName: env.AISENSY_CAMPAIGN_NAME,
        destination: phone,
        userName: env.AISENSY_USER_NAME,
        templateParams: [otp, String(ttlMinutes)],
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 },
    );
    logger.info('AiSensy OTP sent', { phone });
    return { success: true };
  } catch (err) {
    const error = axios.isAxiosError(err)
      ? (err.response?.data ? JSON.stringify(err.response.data) : err.message)
      : String(err);
    logger.error('AiSensy send failed', { phone, error });
    return { success: false, error };
  }
}

export function sendWhatsAppOtpAsync(phone: string, otp: string, ttlMinutes: number): void {
  sendWhatsAppOtp(phone, otp, ttlMinutes).then((result) => {
    if (!result.success) {
      logger.error('Background AiSensy OTP failed', { phone, error: result.error });
    }
  }).catch((err) => {
    logger.error('Background AiSensy OTP threw', { error: err instanceof Error ? err.message : String(err) });
  });
}
