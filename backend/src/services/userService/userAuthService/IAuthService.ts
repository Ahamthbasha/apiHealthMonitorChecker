
import { IAuthResponse, ILoginDTO, IRegisterDTO, IResendOTPDTO, IVerifyOTPDTO, IVerifyOTPResponse } from '../../../dto/authDTO';
import { IUser } from '../../../models/userModel';


export interface IAuthService {
  initiateRegistration(data: IRegisterDTO): Promise<{ 
    registrationToken: string; 
    expiresIn: number;
    email: string;
  }>;
  
  verifyOTPAndCompleteRegistration(
    data: IVerifyOTPDTO, 
    registrationToken: string
  ): Promise<IVerifyOTPResponse>;
  
  resendOTP(data: IResendOTPDTO): Promise<{ expiresIn: number }>;
  
  login(data: ILoginDTO): Promise<IAuthResponse>;
  
  getCurrentUser(userId: string): Promise<IUser>;
}