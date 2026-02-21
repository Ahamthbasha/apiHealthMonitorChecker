import { User, IUser } from "../../../models/userModel"
import { GenericRepository } from '../../genericRepo/genericRepo';
import { IUserRepository } from './IuserAuthRepo';

export class UserRepository extends GenericRepository<IUser> implements IUserRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email, isActive: true });
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return this.model
      .findOne({ email, isActive: true })
      .select('+password')
      .lean()         
      .exec();
  }

  async findById(id: string): Promise<IUser | null> {
    return super.findById(id); 
  }

}