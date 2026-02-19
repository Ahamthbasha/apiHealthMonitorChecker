import { IOTP } from '../../../models/otpModel';
import { OTP } from '../../../models/otpModel';
import { IOTPRepository } from './IOtpRepo';
import { GenericRepository } from '../../genericRepo/genericRepo';

export class OTPRepository extends GenericRepository<IOTP> implements IOTPRepository {
  constructor() {
    super(OTP);
  }
  
  async createOTP(email: string, otp: string): Promise<IOTP> {
    return await super.create({ email, otp });
  }

  async findByEmail(email: string): Promise<IOTP | null> {
    return await this.findOne({ email });
  }

  async deleteByEmail(email: string): Promise<void> {
    await this.model.deleteMany({ email });
  }
}