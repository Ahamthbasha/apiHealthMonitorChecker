import { IGenericRepository } from "../../genericRepo/interface/IGenericRepo";
import { IUser } from "../../../models/userModel";

export interface IUserRepository extends IGenericRepository<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findByEmailWithPassword(email: string): Promise<IUser | null>;
}
