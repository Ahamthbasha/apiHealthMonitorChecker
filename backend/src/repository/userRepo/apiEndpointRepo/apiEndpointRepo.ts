
import { ApiEndpoint, IApiEndpoint } from "../../../models/apiEndpointModel"
import { GenericRepository } from "../../genericRepo/genericRepo"; 
import { IApiEndpointRepository } from "./IApiEndpointRepo";


export class ApiEndpointRepository extends GenericRepository<IApiEndpoint> implements IApiEndpointRepository {
  constructor() {
    super(ApiEndpoint);
  }

  async findByUser(userId: string): Promise<IApiEndpoint[]> {
    return this.findAll({ userId });
  }

  async findActiveByUser(userId: string): Promise<IApiEndpoint[]> {
    return this.findAll({ 
      userId, 
      isActive: true 
    });
  }

  async findByIdAndUser(id: string, userId: string): Promise<IApiEndpoint | null> {
    return this.findOne({ 
      _id: id, 
      userId 
    });
  }

  async updateInterval(id: string, interval: number): Promise<IApiEndpoint | null> {
    return this.update(id, { interval });
  }

  async toggleActive(id: string, userId: string): Promise<IApiEndpoint | null> {
    const endpoint = await this.findByIdAndUser(id, userId);
    if (!endpoint) return null;
    
    return this.update(id, { isActive: !endpoint.isActive });
  }

  async countByUser(userId: string): Promise<number> {
    return this.count({ userId });
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }
}