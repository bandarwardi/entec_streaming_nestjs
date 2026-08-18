import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Host } from './host.schema';

export type CustomerDocument = Customer & Document;

export enum CustomerStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
}



@Schema({ _id: true })
export class CustomerSubscription {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
  host: any;

  @Prop({ type: String, enum: CustomerStatus, default: CustomerStatus.ACTIVE })
  status: string;

  @Prop({ required: true })
  macAddress: string;

  @Prop({ required: true })
  deviceKey: string;

  @Prop({ type: Date, default: Date.now })
  lastActive: Date;

  @Prop({ type: Boolean, default: true })
  appActive: boolean;

  @Prop({ type: Date, default: null })
  appExpiry: Date;
}

export const CustomerSubscriptionSchema = SchemaFactory.createForClass(CustomerSubscription);

@Schema({ timestamps: true })
export class Customer {
  @Prop({ required: true })
  name: string;

  @Prop({ type: String, enum: CustomerStatus, default: CustomerStatus.ACTIVE })
  status: string;

  @Prop({ type: [CustomerSubscriptionSchema], default: [] })
  subscriptions: CustomerSubscription[];
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
