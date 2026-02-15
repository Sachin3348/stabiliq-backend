import dotenv from 'dotenv';

dotenv.config();

/** Typed app config from environment */
export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '8000', 10),
  MONGO_URL: process.env.MONGO_URL ?? '',
  DB_NAME: process.env.DB_NAME ?? 'stabiliq',
  /** JWT secret (supports JWT_SECRET or JWT_SECRET_KEY for backward compatibility) */
  JWT_SECRET: process.env.JWT_SECRET ?? process.env.JWT_SECRET_KEY ?? 'stabiliq_secret_key_change_in_production',
  JWT_EXPIRE_DAYS: parseInt(process.env.JWT_EXPIRE_DAYS ?? '30', 10),
  /** Comma-separated origins; '*' means allow all */
  CORS_ORIGINS: process.env.CORS_ORIGINS ?? '*',
  /** Email: SendGrid (preferred, works on Render) or Gmail/SMTP */
  SENDGRID_API_KEY: (process.env.SENDGRID_API_KEY ?? '').replace(/^["']|["']$/g, '').trim(),
  MAIL_FROM: (process.env.MAIL_FROM ?? 'noreply@stabiliq.in').replace(/^["']|["']$/g, '').trim(),
  /** Gmail OAuth2 (fallback, may not work on Render due to SMTP restrictions) */
  GMAIL_USER: process.env.GMAIL_USER ?? '',
  GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID ?? '',
  GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET ?? '',
  GMAIL_REFRESH_TOKEN: (process.env.GMAIL_REFRESH_TOKEN ?? '').replace(/^["']|["']$/g, '').trim(),
  /** Fallback SMTP */
  SMTP_HOST: process.env.SMTP_HOST ?? '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT ?? '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER ?? '',
  SMTP_PASS: process.env.SMTP_PASS ?? '',
  /** OTP validity in minutes (for email OTP) */
  OTP_TTL_MINUTES: parseInt(process.env.OTP_TTL_MINUTES ?? '10', 10),
} as const;

export type Env = typeof env;
