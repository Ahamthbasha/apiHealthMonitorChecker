import { IUser } from '../../../models/userModel';

export interface IUserService {
  getUserById(userId: string): Promise<IUser>;
}