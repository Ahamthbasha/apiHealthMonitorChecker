
import { Document, Model, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import { IGenericRepository } from './interface/IGenericRepo';

export class GenericRepository<T extends Document> implements IGenericRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    const document = new this.model(data);
    return await document.save();
  }

  async findById(id: string, projection?: string): Promise<T | null> {
    return await this.model.findById(id, projection).exec();
  }

  async findOne(filter: FilterQuery<T>, projection?: string): Promise<T | null> {
    return await this.model.findOne(filter, projection).exec();
  }

  async findAll(filter: FilterQuery<T> = {}, options: QueryOptions = {}): Promise<T[]> {
    return await this.model.find(filter, null, options).exec();
  }

  async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return await this.model
      .findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .exec();
  }

  async delete(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id).exec();
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const count = await this.model.countDocuments(filter).exec();
    return count > 0;
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return await this.model.countDocuments(filter).exec();
  }
}