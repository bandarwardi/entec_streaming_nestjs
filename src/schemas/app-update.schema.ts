import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AppUpdateDocument = HydratedDocument<AppUpdate>;
export const APP_UPDATE_PLATFORMS = ['windows', 'android', 'ios', 'web'] as const;
export type AppUpdatePlatform = typeof APP_UPDATE_PLATFORMS[number];

@Schema({ timestamps: true })
export class AppUpdate {
  @Prop({ type: String, enum: APP_UPDATE_PLATFORMS, required: true, unique: true })
  platform: string;

  @Prop({ required: true, match: /^\d+\.\d+\.\d+$/ })
  version: string;

  @Prop({ default: '' })
  downloadUrl: string;

  @Prop({ default: '', match: /^$|^[a-f\d]{64}$/i })
  sha256: string;
}

export const AppUpdateSchema = SchemaFactory.createForClass(AppUpdate);
