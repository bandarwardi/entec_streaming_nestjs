import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service';
import { DeviceStatus } from '../schemas/device.schema';
import { Host } from '../schemas/host.schema';

@Injectable()
export class ClientService {
  constructor(private readonly devicesService: DevicesService) {}

  async auth(macAddress: string, deviceKey: string) {
    // Normalize MAC address (uppercase, remove special chars)
    const normalizedMac = macAddress.toUpperCase().replace(/[^A-F0-9]/g, '');

    let device = await this.devicesService.findByMac(normalizedMac);

    if (!device) {
      // Auto-register device on first contact with empty credentials
      device = (await this.devicesService.create({ 
        macAddress: normalizedMac,
        deviceKey: deviceKey,
        username: '',
        password: '' 
      })) as any;
    }

    if (!device) {
      throw new NotFoundException('حدث خطأ أثناء تسجيل الجهاز');
    }

    // Verify Device Key
    if (device.deviceKey !== deviceKey) {
      throw new ForbiddenException('Device Key غير صالح. هذا الجهاز مرتبط بمفتاح آخر.');
    }

    // Update last active timestamp
    await this.devicesService.updateLastActive(normalizedMac);

    if (device.status === DeviceStatus.BLOCKED) {
      throw new ForbiddenException('هذا الجهاز محظور. يرجى التواصل مع الإدارة.');
    }

    if (!device.host) {
      throw new NotFoundException('لم يتم تعيين خادم بث (Host) لهذا الجهاز بعد. يرجى التواصل مع الإدارة.');
    }

    const host = device.host as unknown as Host & { _id: string };
    
    // Validate if the device has valid credentials
    if (!device.username || !device.password) {
      throw new ForbiddenException('لم يتم تزويد هذا الجهاز بمعلومات تسجيل دخول للبث (Username/Password). يرجى التواصل مع الإدارة.');
    }

    return {
      host: (host as any).url,
      username: device.username,
      password: device.password,
    };
  }
}
