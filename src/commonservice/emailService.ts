import nodemailer, { Transporter } from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import sgMail from '@sendgrid/mail';
import { env } from '../config/env';
import logger from './logger';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

let smtpTransporter: Transporter | null = null;
let gmailTransporter: Transporter | null = null;
let gmailTransporterExpiresAt = 0;

/** Prefer SendGrid when API key is set (works on Render; uses HTTPS) */
function isSendGridConfigured(): boolean {
  return !!env.SENDGRID_API_KEY;
}

/** True when Gmail OAuth2 env vars are set */
function isGmailOAuthConfigured(): boolean {
  const { GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = env;
  return !!(GMAIL_USER && GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN);
}

const GMAIL_OAUTH_TIMEOUT_MS = 15000;

/** Send via SendGrid API (HTTPS, works on Render) */
async function sendViaSendGrid(options: SendMailOptions): Promise<SendMailResult> {
  const to = Array.isArray(options.to) ? options.to : [options.to];
  sgMail.setApiKey(env.SENDGRID_API_KEY);
  try {
    const [response] = await sgMail.send({
      to,
      from: env.MAIL_FROM,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo,
    });
    logger.info('Email sent (SendGrid)', { messageId: response.headers['x-message-id'], to });
    return {
      success: true,
      messageId: (response.headers['x-message-id'] as string) ?? undefined,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const body = err && typeof err === 'object' && 'response' in err
      ? (err as { response?: { body?: unknown } }).response?.body
      : undefined;
    logger.error('SendGrid send failed', { error: msg, body, to });
    return { success: false, error: msg };
  }
}

/** Get Gmail OAuth2 access token from refresh token */
async function getGmailAccessToken(): Promise<string> {
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = env;
  const oauth2Client = new OAuth2Client(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  oauth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });

  const tokenPromise = (async () => {
    const { token } = await oauth2Client.getAccessToken();
    if (!token) throw new Error('Failed to obtain Gmail access token');
    return token;
  })();

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error('Gmail OAuth timeout. Check refresh token or use SendGrid.')),
      GMAIL_OAUTH_TIMEOUT_MS
    );
  });

  try {
    return await Promise.race([tokenPromise, timeoutPromise]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('invalid_grant')) {
      throw new Error(
        'Gmail refresh token invalid or expired. Use SendGrid (SENDGRID_API_KEY) or re-authorize Gmail.'
      );
    }
    throw err;
  }
}

/** Get Gmail transporter (cached, re-created when token expires in ~55 min) */
async function getGmailTransporter(): Promise<Transporter> {
  if (gmailTransporter && Date.now() < gmailTransporterExpiresAt) {
    return gmailTransporter;
  }
  const accessToken = await getGmailAccessToken();
  gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    pool: true,
    maxConnections: 5,
    auth: {
      type: 'OAuth2',
      user: env.GMAIL_USER,
      clientId: env.GMAIL_CLIENT_ID,
      clientSecret: env.GMAIL_CLIENT_SECRET,
      refreshToken: env.GMAIL_REFRESH_TOKEN,
      accessToken,
    },
    connectionTimeout: 10000,
    greetingTimeout: 8000,
    socketTimeout: 15000,
  });
  gmailTransporterExpiresAt = Date.now() + 55 * 60 * 1000;
  return gmailTransporter;
}

/** Get SMTP transporter (cached) */
function getSmtpTransporter(): Transporter | null {
  if (smtpTransporter) return smtpTransporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  smtpTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    requireTLS: true,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 8000,
    socketTimeout: 15000,
  });
  return smtpTransporter;
}

/**
 * Send email. Prefers SendGrid if SENDGRID_API_KEY is set (recommended on Render).
 * Otherwise uses Gmail OAuth2 or SMTP.
 */
export async function sendMail(options: SendMailOptions): Promise<SendMailResult> {
  if (isSendGridConfigured()) {
    return sendViaSendGrid(options);
  }

  let transport: Transporter | null = null;
  try {
    if (isGmailOAuthConfigured()) {
      transport = await getGmailTransporter();
    } else {
      transport = getSmtpTransporter();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Email transport failed', { error: message });
    return { success: false, error: message };
  }

  if (!transport) {
    logger.warn('Email skipped: set SENDGRID_API_KEY (recommended) or Gmail OAuth / SMTP env vars');
    return { success: false, error: 'Email not configured' };
  }

  const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;
  const t0 = Date.now();
  try {
    const info = await transport.sendMail({
      from: env.MAIL_FROM,
      to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo,
    });
    logger.info('Email sent', { messageId: info.messageId, to, durationMs: Date.now() - t0 });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Email send failed', { error: message, to, durationMs: Date.now() - t0 });
    return { success: false, error: message };
  }
}

/**
 * Call once at app startup to warm up the transport.
 * No-op for SendGrid (HTTP-based). For SMTP/Gmail, creates the pooled transporter eagerly.
 */
export async function initEmailTransport(): Promise<void> {
  if (isSendGridConfigured()) {
    sgMail.setApiKey(env.SENDGRID_API_KEY);
    logger.info('Email transport: SendGrid ready');
    return;
  }
  if (isGmailOAuthConfigured()) {
    try {
      await getGmailTransporter();
      logger.info('Email transport: Gmail OAuth2 ready');
    } catch (err) {
      logger.error('Email transport: Gmail init failed', { error: err instanceof Error ? err.message : err });
    }
    return;
  }
  const t = getSmtpTransporter();
  if (t) {
    t.verify().then(() => {
      logger.info('Email transport: SMTP ready');
    }).catch((err) => {
      logger.warn('Email transport: SMTP verify failed (non-fatal)', { error: err instanceof Error ? err.message : err });
    });
  } else {
    logger.warn('Email transport: not configured');
  }
}

/**
 * Fire-and-forget variant. Returns immediately; logs failures in background.
 * Use for OTP and non-critical transactional emails.
 */
export function sendMailAsync(options: SendMailOptions): void {
  sendMail(options).then((result) => {
    if (!result.success) {
      logger.error('Background email failed', { error: result.error, to: options.to });
    }
  }).catch((err) => {
    logger.error('Background email threw', { error: err instanceof Error ? err.message : String(err) });
  });
}

/** Which provider is active (for logs). */
export function getEmailProvider(): 'sendgrid' | 'gmail' | 'smtp' | 'none' {
  if (isSendGridConfigured()) return 'sendgrid';
  if (isGmailOAuthConfigured()) return 'gmail';
  if (getSmtpTransporter()) return 'smtp';
  return 'none';
}

/**
 * Verify email transport. Resolves false if not configured.
 */
export async function verifyTransport(): Promise<boolean> {
  if (isSendGridConfigured()) {
    logger.info('Email transport: SendGrid configured');
    return true;
  }
  const transport = isGmailOAuthConfigured()
    ? await getGmailTransporter().catch(() => null)
    : getSmtpTransporter();
  if (!transport) return false;
  try {
    await transport.verify();
    logger.info('Email transport verified', { type: isGmailOAuthConfigured() ? 'gmail' : 'smtp' });
    return true;
  } catch (err) {
    logger.error('Email verify failed', { error: err instanceof Error ? err.message : err });
    return false;
  }
}
