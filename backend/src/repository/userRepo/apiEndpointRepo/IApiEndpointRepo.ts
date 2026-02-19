import { IGenericRepository } from "../../genericRepo/interface/IGenericRepo";
import { IApiEndpoint } from "../../../models/apiEndpointModel";

export interface IApiEndpointRepository extends IGenericRepository<IApiEndpoint> {
  findByUser(userId: string): Promise<IApiEndpoint[]>;
  findActiveByUser(userId: string): Promise<IApiEndpoint[]>;
  findByIdAndUser(id: string, userId: string): Promise<IApiEndpoint | null>;
  updateInterval(id: string, interval: number): Promise<IApiEndpoint | null>;
  toggleActive(id: string, userId: string): Promise<IApiEndpoint | null>;
  countByUser(userId: string): Promise<number>;
}
