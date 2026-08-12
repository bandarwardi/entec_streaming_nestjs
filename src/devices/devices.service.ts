import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument, DeviceStatus } from '../schemas/device.schema';
import { CreateDeviceDto } from './create-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
  ) {}

  async findAll(): Promise<Device[]> {
    return this.deviceModel.find().populate('host').exec();
  }

  async findOne(id: string): Promise<Device> {
    const device = await this.deviceModel.findById(id).populate('host');
    if (!device) throw new NotFoundException('الجهاز غير موجود');
    return device;
  }

  async findByMac(macAddress: string): Promise<DeviceDocument | null> {
    return this.deviceModel.findOne({ macAddress }).populate('host').exec();
  }

  async create(dto: CreateDeviceDto): Promise<Device> {
    const device = new this.deviceModel({
      macAddress: dto.macAddress,
      deviceKey: dto.deviceKey,
      username: dto.username,
      password: dto.password,
      host: dto.hostId || null,
    });
    return device.save();
  }
  
  async update(id: string, dto: Partial<CreateDeviceDto>): Promise<Device> {
    const updateData: any = { ...dto };
    if (dto.hostId !== undefined) {
      updateData.host = dto.hostId;
      delete updateData.hostId;
    }
    const updated = await this.deviceModel.findByIdAndUpdate(id, updateData, { new: true }).populate('host');
    if (!updated) throw new NotFoundException('الجهاز غير موجود');
    return updated;
  }

  async assignHost(id: string, hostId: string): Promise<Device> {
    const device = await this.deviceModel.findByIdAndUpdate(
      id,
      { host: hostId },
      { new: true },
    ).populate('host');
    if (!device) throw new NotFoundException('الجهاز غير موجود');
    return device;
  }

  async block(id: string): Promise<Device> {
    const device = await this.deviceModel.findByIdAndUpdate(
      id,
      { status: DeviceStatus.BLOCKED },
      { new: true },
    ).populate('host');
    if (!device) throw new NotFoundException('الجهاز غير موجود');
    return device;
  }

  async unblock(id: string): Promise<Device> {
    const device = await this.deviceModel.findByIdAndUpdate(
      id,
      { status: DeviceStatus.ACTIVE },
      { new: true },
    ).populate('host');
    if (!device) throw new NotFoundException('الجهاز غير موجود');
    return device;
  }

  async remove(id: string): Promise<{ message: string }> {
    const deleted = await this.deviceModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('الجهاز غير موجود');
    return { message: 'تم حذف الجهاز بنجاح' };
  }

  async updateLastActive(macAddress: string): Promise<void> {
    await this.deviceModel.findOneAndUpdate({ macAddress }, { lastActive: new Date() });
  }

  async getStats() {
    const total = await this.deviceModel.countDocuments();
    const active = await this.deviceModel.countDocuments({ status: DeviceStatus.ACTIVE });
    const blocked = await this.deviceModel.countDocuments({ status: DeviceStatus.BLOCKED });
    return { total, active, blocked };
  }
}
