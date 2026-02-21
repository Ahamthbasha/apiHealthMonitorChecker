
import { CreateEndpointDTO, UpdateEndpointDTO } from "../../../dto/endpointDTO";
import { IApiEndpoint } from "../../../models/apiEndpointModel"; 



export interface IApiEndpointService {
  createEndpoint(userId: string, data: CreateEndpointDTO): Promise<IApiEndpoint>;
  getEndpointById(id: string, userId: string): Promise<IApiEndpoint>;
  updateEndpoint(id: string, userId: string, data: UpdateEndpointDTO): Promise<IApiEndpoint>;
  deleteEndpoint(id: string, userId: string): Promise<void>;
  toggleEndpoint(id: string, userId: string): Promise<IApiEndpoint>;
  validateEndpoint(data: CreateEndpointDTO): Promise<void>;
}