import { Injectable } from '@nestjs/common';

@Injectable()
export class OtpService {
  private otpStore = new Map<string, { otp: string; expiresAt: number }>();

  generateOtp(): string {
    return Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit OTP
  }

  saveOtp(userId: string): string {
    const otp = this.generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000; // Valid for 5 minutes
    this.otpStore.set(userId, { otp, expiresAt });
    return otp;
  }

  verifyOtp(userId: string, providedOtp: string): boolean {
    const otpData = this.otpStore.get(userId);
    if (!otpData) return false; // OTP not found or expired

    const { otp, expiresAt } = otpData;
    if (Date.now() > expiresAt) {
      this.otpStore.delete(userId); // Remove expired OTP
      return false;
    }

    if (otp === providedOtp) {
      this.otpStore.delete(userId); // OTP is valid, remove it after use
      return true;
    }
    return false;
  }
}
