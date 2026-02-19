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

  async searchUsers(query: string, excludeUserId: string): Promise<IUser[]> {
    if (!query || query.length < 2) return [];
    
    return this.model.find({
      _id: { $ne: excludeUserId },
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('_id name email role')
    .limit(10)
    .lean();
  }

  async getAllActiveUsers(excludeUserId: string): Promise<IUser[]> {
    return this.model.find({
      _id: { $ne: excludeUserId },
      isActive: true
    })
    .select('_id name email role')
    .limit(50)
    .lean();
  }
}