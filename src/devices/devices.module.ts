import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Device, DeviceSchema } from '../schemas/device.schema';
import { AuthModule } from '../auth/auth.module';
import { HostsModule } from '../hosts/hosts.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
    AuthModule,
    HostsModule,
  ],
  providers: [DevicesService],
  controllers: [DevicesController],
  exports: [DevicesService, MongooseModule],
})
export class DevicesModule {}
