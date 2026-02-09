import { userRepository } from '../repository/userRepository';
import { userOtpVerificationRepository } from '../repository/userOtpVerificationRepository';
import { createAccessToken } from '../middlewares/auth';
import type { UserDto } from '../types/user';
import type { JwtPayload } from '../types/auth';
import { AppError } from '../middlewares/AppError';
import { sendMail } from '../commonservice/emailService';
import { env } from '../config/env';

export interface SendOtpResult {
  success: true;
  message: string;
}

export interface VerifyOtpResult {
  success: true;
  token: string;
  user: UserDto;
}

export interface LoginResult {
  success: true;
  message: string;
}

export interface MeResult {
  user: UserDto;
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function storeOtp(email: string, otp: string): Promise<void> {
  const expiresAt = new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000);
  await userOtpVerificationRepository.create(email, otp, expiresAt);
}

export const authService = {
  async sendOtp(email: string, _phone: string): Promise<SendOtpResult> {
    const otp = generateOtp();
    await storeOtp(email, otp);

    const sent = await sendMail({
      to: email,
      subject: 'Your Stabiliq verification code',
      text: `Your OTP is ${otp}. It is valid for ${env.OTP_TTL_MINUTES} minutes.`,
      html: `<p>Your verification code is <strong>${otp}</strong>.</p><p>It is valid for ${env.OTP_TTL_MINUTES} minutes.</p>`,
    });
    if (!sent.success) {
      throw new AppError(sent.error ?? 'Failed to send OTP email', 503);
    }

    return {
      success: true,
      message: 'OTP sent successfully to your email',
    };
  },

  async  verifyOtp(
    email: string,
    phone: string,
    otp: string,
    name: string,
    plan: string = 'basic'
  ): Promise<VerifyOtpResult> {
    const valid = await userOtpVerificationRepository.validateAndConsume(email, otp);
    if (!valid) {
      throw new AppError('Invalid or expired OTP', 400);
    }
    let user = await userRepository.findByEmail(email);
    const enrollmentDate = new Date();

    if (user) {
      const userData: UserDto = userRepository.toUserDto(user);
      const token = createAccessToken({ sub: userData.email, id: userData.id });
      return { success: true, token, user: userData };
    }

    user = await userRepository.create({
      email,
      name,
      phone,
      plan,
      enrollmentDate,
      isActive: true,
    });
    const userData: UserDto = userRepository.toUserDto(user);
    const token = createAccessToken({ sub: userData.email, id: userData.id });
    return { success: true, token, user: userData };
  },

  async login(email: string): Promise<LoginResult> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('User not found. Please sign up first.', 404);
    }
    const otp = generateOtp();
    await storeOtp(email, otp);

    const sent = await sendMail({
      to: email,
      subject: 'Your Stabiliq login code',
      text: `Your OTP is ${otp}. It is valid for ${env.OTP_TTL_MINUTES} minutes.`,
      html: `<p>Your login code is <strong>${otp}</strong>.</p><p>It is valid for ${env.OTP_TTL_MINUTES} minutes.</p>`,
    });
    if (!sent.success) {
      throw new AppError(sent.error ?? 'Failed to send OTP email', 503);
    }

    return {
      success: true,
      message: 'OTP sent successfully to your email',
    };
  },

  async me(payload: JwtPayload): Promise<MeResult> {
    const user = await userRepository.findByEmail(payload.sub);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return { user: userRepository.toUserDto(user) };
  },
};
