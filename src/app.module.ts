import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HostsModule } from './hosts/hosts.module';
import { CustomersModule } from './customers/customers.module';
import { ClientModule } from './client/client.module';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PlansModule } from './plans/plans.module';
import { DevicesModule } from './devices/devices.module';
import { PortalModule } from './portal/portal.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/streaming'),
      }),
      inject: [ConfigService],
    }),
    AuthModule, 
    HostsModule, 
    CustomersModule, 
    ClientModule, PlansModule, DevicesModule, PortalModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
