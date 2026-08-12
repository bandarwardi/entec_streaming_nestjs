import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HostDocument = Host & Document;

@Schema({ timestamps: true })
export class Host {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;
}

export const HostSchema = SchemaFactory.createForClass(Host);
