import { userRepository } from '../repository/userRepository';
import { userOtpVerificationRepository } from '../repository/userOtpVerificationRepository';
import { createAccessToken } from '../middlewares/auth';
import type { UserDto } from '../types/user';
import type { JwtPayload } from '../types/auth';
import { AppError } from '../middlewares/AppError';
import { isAiSensyConfigured, sendWhatsAppOtpAsync } from '../commonservice/aisensyService';
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

async function storeOtp(phone: string, otp: string): Promise<void> {
  const expiresAt = new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000);
  await userOtpVerificationRepository.create(phone, otp, expiresAt);
}

export const authService = {
  async sendOtp(phone: string, _email?: string): Promise<SendOtpResult> {
    const otp = generateOtp();
    await storeOtp(phone, otp);

    if (isAiSensyConfigured()) {
      sendWhatsAppOtpAsync(phone, otp, env.OTP_TTL_MINUTES);
    }

    return {
      success: true,
      message: 'OTP sent successfully to your WhatsApp',
    };
  },

  async verifyOtp(
    phone: string,
    otp: string,
    name?: string,
    email?: string,
  ): Promise<VerifyOtpResult> {
    const valid = await userOtpVerificationRepository.validateAndConsume(phone, otp);
    if (!valid) {
      throw new AppError('Invalid or expired OTP', 400);
    }
    let user = await userRepository.findByPhone(phone);
    const enrollmentDate = new Date();

    if (user) {
      const userData: UserDto = userRepository.toUserDto(user);
      const token = createAccessToken({ sub: phone, id: userData.id, mobile: phone });
      return { success: true, token, user: userData };
    }

    user = await userRepository.create({
      phone,
      email: email ?? undefined,
      name: name ?? '',
      enrollmentDate,
      isActive: true,
    });
    const userData: UserDto = userRepository.toUserDto(user);
    const token = createAccessToken({ sub: phone, id: userData.id, mobile: phone });
    return { success: true, token, user: userData };
  },

  async login(phone: string): Promise<LoginResult> {
    const user = await userRepository.findByPhone(phone);
    if (!user) {
      throw new AppError('User not found. Please sign up first.', 404);
    }
    const otp = generateOtp();
    await storeOtp(phone, otp);

    if (isAiSensyConfigured()) {
      sendWhatsAppOtpAsync(phone, otp, env.OTP_TTL_MINUTES);
    }

    return {
      success: true,
      message: 'OTP sent successfully to your WhatsApp',
    };
  },

  async me(payload: JwtPayload): Promise<MeResult> {
    const user = await userRepository.findByPhone(payload.sub);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return { user: userRepository.toUserDto(user) };
  },
};
