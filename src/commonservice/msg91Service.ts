import axios from 'axios';
import { env } from '../config/env';
import logger from './logger';

const MSG91_API_URL =
  'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/';

export interface SendWhatsAppOtpResult {
  success: boolean;
  error?: string;
}

export function isMsg91Configured(): boolean {
  return !!(env.MSG91_AUTH_KEY && env.MSG91_INTEGRATED_NUMBER && env.MSG91_WA_TEMPLATE_NAME);
}

export async function sendWhatsAppOtp(
  phone: string,
  otp: string,
  _: number,
): Promise<SendWhatsAppOtpResult> {
  try {
    const to = phone.replace(/[^\d]/g, '');
    await axios.post(
      MSG91_API_URL,
      {
        integrated_number: env.MSG91_INTEGRATED_NUMBER,
        content_type: 'template',
        payload: {
          messaging_product: 'whatsapp',
          type: 'template',
          template: {
            name: env.MSG91_WA_TEMPLATE_NAME,
            language: {
              code: env.MSG91_WA_LANG_CODE,
              policy: 'deterministic',
            },
            namespace: env.MSG91_WA_NAMESPACE,
            to_and_components: [
              {
                to: [to],
                components: {
                  body_1: {
                    type: 'text',
                    value: otp,
                  },
                  button_1: {
                    subtype: 'url',
                    type: 'text',
                    value: otp,
                  },
                },
              },
            ],
          },
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          authkey: env.MSG91_AUTH_KEY,
        },
        timeout: 10000,
      },
    );
    logger.info('MSG91 WhatsApp OTP sent', { phone });
    return { success: true };
  } catch (err) {
    const error = axios.isAxiosError(err)
      ? (err.response?.data ? JSON.stringify(err.response.data) : err.message)
      : String(err);
    logger.error('MSG91 send failed', { phone, error });
    return { success: false, error };
  }
}

export function sendWhatsAppOtpAsync(phone: string, otp: string, ttlMinutes: number): void {
  sendWhatsAppOtp(phone, otp, ttlMinutes).then((result) => {
    if (!result.success) {
      logger.error('Background MSG91 OTP failed', { phone, error: result.error });
    }
  }).catch((err) => {
    logger.error('Background MSG91 OTP threw', { error: err instanceof Error ? err.message : String(err) });
  });
}
