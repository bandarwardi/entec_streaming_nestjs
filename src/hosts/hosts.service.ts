import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Host, HostDocument } from '../schemas/host.schema';
import { CreateHostDto } from './create-host.dto';

@Injectable()
export class HostsService {
  constructor(
    @InjectModel(Host.name) private hostModel: Model<HostDocument>,
  ) {}

  async findAll(): Promise<Host[]> {
    return this.hostModel.find().exec();
  }

  async findOne(id: string): Promise<Host> {
    const host = await this.hostModel.findById(id);
    if (!host) throw new NotFoundException('السيرفر غير موجود');
    return host;
  }

  async create(dto: CreateHostDto): Promise<Host> {
    const created = new this.hostModel(dto);
    return created.save();
  }

  async update(id: string, dto: Partial<CreateHostDto>): Promise<Host> {
    const updated = await this.hostModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException('السيرفر غير موجود');
    return updated;
  }

  async remove(id: string): Promise<{ message: string }> {
    const deleted = await this.hostModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('السيرفر غير موجود');
    return { message: 'تم حذف السيرفر بنجاح' };
  }
}
