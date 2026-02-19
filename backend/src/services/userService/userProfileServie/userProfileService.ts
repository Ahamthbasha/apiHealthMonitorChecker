
import { IUserRepository } from '../../../repository/userRepo/userAuthRepo/IuserAuthRepo'; 
import { IUserService } from './IUserProfileService'; 
import { IUser } from '../../../models/userModel';
import { AppError } from '../../../utils/errorUtil/appError';

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}

  async getUserById(userId: string): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }
}