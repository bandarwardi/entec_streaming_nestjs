import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plan, PlanDocument } from '../schemas/plan.schema';

@Injectable()
export class PlansService {
  constructor(@InjectModel(Plan.name) private planModel: Model<PlanDocument>) {}

  async findAllActive(): Promise<Plan[]> {
    return this.planModel.find({ isActive: true }).exec();
  }

  async findAllAdmin(): Promise<Plan[]> {
    return this.planModel.find().exec();
  }

  async create(data: Partial<Plan>): Promise<Plan> {
    const newPlan = new this.planModel(data);
    return newPlan.save();
  }

  async update(id: string, data: Partial<Plan>): Promise<Plan> {
    const updated = await this.planModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!updated) throw new NotFoundException('Plan not found');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.planModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Plan not found');
  }
}
