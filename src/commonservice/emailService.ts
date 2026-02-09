import nodemailer, { Transporter } from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import logger from './logger';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

let smtpTransporter: Transporter | null = null;

/** True when Gmail OAuth2 env vars are set */
function isGmailOAuthConfigured(): boolean {
  const { GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = env;
  return !!(GMAIL_USER && GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN);
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
  const { token } = await oauth2Client.getAccessToken();
  if (!token) {
    throw new Error('Failed to obtain Gmail access token');
  }
  return token;
}

/** Create a Nodemailer transporter for Gmail OAuth2 (fresh token each time) */
async function createGmailTransporter(): Promise<Transporter> {
  const accessToken = await getGmailAccessToken();
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: env.GMAIL_USER,
      clientId: env.GMAIL_CLIENT_ID,
      clientSecret: env.GMAIL_CLIENT_SECRET,
      refreshToken: env.GMAIL_REFRESH_TOKEN,
      accessToken,
    },
  });
}

/** Get SMTP transporter (cached); used when Gmail OAuth2 is not configured */
function getSmtpTransporter(): Transporter | null {
  if (smtpTransporter) return smtpTransporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  smtpTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  return smtpTransporter;
}

/** Resolve the transporter to use (Gmail OAuth2 or SMTP), or null if not configured */
async function getTransporter(): Promise<Transporter | null> {
  if (isGmailOAuthConfigured()) {
    return createGmailTransporter();
  }
  return getSmtpTransporter();
}

/**
 * Send an email via Gmail (OAuth2) or SMTP.
 * If neither is configured, logs and returns success: false.
 */
export async function sendMail(options: SendMailOptions): Promise<SendMailResult> {
  const transport = await getTransporter();
  if (!transport) {
    const hint = isGmailOAuthConfigured()
      ? 'Check Gmail OAuth2 credentials'
      : 'Set GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN or SMTP_*';
    logger.warn('Email skipped: not configured', { hint });
    return { success: false, error: 'Email not configured' };
  }

  const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;

  try {
    const info = await transport.sendMail({
      from: env.MAIL_FROM,
      to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo,
    });
    logger.info('Email sent', { messageId: info.messageId, to });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Email send failed', { error: message, to });
    return { success: false, error: message };
  }
}

/**
 * Verify email transport (Gmail or SMTP). Resolves false if not configured.
 */
export async function verifyTransport(): Promise<boolean> {
  const transport = await getTransporter();
  if (!transport) return false;
  try {
    await transport.verify();
    logger.info('Email transport verified', {
      type: isGmailOAuthConfigured() ? 'gmail_oauth2' : 'smtp',
    });
    return true;
  } catch (err) {
    logger.error('Email verify failed', { error: err instanceof Error ? err.message : err });
    return false;
  }
}
