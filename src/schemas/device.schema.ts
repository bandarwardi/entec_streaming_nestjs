import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Host } from './host.schema';

export type DeviceDocument = Device & Document;

export enum DeviceStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
}

@Schema({ timestamps: true })
export class Device {
  @Prop({ required: true, unique: true })
  macAddress: string;

  @Prop({ required: true })
  deviceKey: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: DeviceStatus, default: DeviceStatus.ACTIVE })
  status: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Host', required: false })
  host: Host;

  @Prop({ type: Date, default: Date.now })
  lastActive: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
