import { Module } from '@nestjs/common';
import { HostsService } from './hosts.service';
import { HostsController } from './hosts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Host, HostSchema } from '../schemas/host.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Host.name, schema: HostSchema }]),
    AuthModule,
  ],
  providers: [HostsService],
  controllers: [HostsController],
  exports: [HostsService, MongooseModule],
})
export class HostsModule {}
