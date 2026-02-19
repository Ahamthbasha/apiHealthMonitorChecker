
import { Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';

export interface IGenericRepository<T extends Document> {
  create(data: Partial<T>): Promise<T>;
  findById(id: string, projection?: string | null): Promise<T | null>;
  findOne(filter: FilterQuery<T>, projection?: string | null): Promise<T | null>;
  findAll(filter?: FilterQuery<T>, options?: QueryOptions): Promise<T[]>;
  update(id: string, data: UpdateQuery<T>): Promise<T | null>;
  delete(id: string): Promise<T | null>;
  exists(filter: FilterQuery<T>): Promise<boolean>;
  count(filter?: FilterQuery<T>): Promise<number>;
}