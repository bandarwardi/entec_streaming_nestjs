import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type DeviceDocument = Device & Document;

@Schema({ _id: true })
export class CustomPlaylist {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;
}

export const CustomPlaylistSchema = SchemaFactory.createForClass(CustomPlaylist);

@Schema({ timestamps: true })
export class Device {
  @Prop({ required: true, unique: true })
  macAddress: string;

  @Prop({ required: true })
  deviceKey: string;

  @Prop({ type: [CustomPlaylistSchema], default: [] })
  customPlaylists: CustomPlaylist[];

  @Prop({ type: Date, default: Date.now })
  lastActive: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
