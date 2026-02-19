import { IOTP } from '../../../models/otpModel';

export interface IOTPRepository {
  createOTP(email: string, otp: string): Promise<IOTP>;
  findByEmail(email: string): Promise<IOTP | null>;
  deleteByEmail(email: string): Promise<void>;
}