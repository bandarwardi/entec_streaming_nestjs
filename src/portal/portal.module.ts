import { Module } from '@nestjs/common';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';
import { DevicesModule } from '../devices/devices.module';
import { CustomersModule } from '../customers/customers.module';
import { HostsModule } from '../hosts/hosts.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DevicesModule, CustomersModule, HostsModule, AuthModule],
  controllers: [PortalController],
  providers: [PortalService]
})
export class PortalModule {}
