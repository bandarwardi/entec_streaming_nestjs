import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AppUpdate, AppUpdateSchema } from '../schemas/app-update.schema';
import { AppUpdatesController } from './app-updates.controller';
import { AppUpdatesService } from './app-updates.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AppUpdate.name, schema: AppUpdateSchema }]),
    AuthModule,
  ],
  controllers: [AppUpdatesController],
  providers: [AppUpdatesService],
})
export class AppUpdatesModule {}
