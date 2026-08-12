import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HostsModule } from './hosts/hosts.module';
import { DevicesModule } from './devices/devices.module';
import { ClientModule } from './client/client.module';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

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
    DevicesModule, 
    ClientModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
