import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service';
import { CustomersService } from '../customers/customers.service';
import { HostsService } from '../hosts/hosts.service';

@Injectable()
export class PortalService {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly customersService: CustomersService,
    private readonly hostsService: HostsService,
  ) {}

  async login(macAddress: string, deviceKey: string) {
    const device = await this.devicesService.findByMac(macAddress);
    if (!device || device.deviceKey !== deviceKey) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    // Also get the customer subscription if it exists
    const customer = await this.customersService.findByMac(macAddress);
    let subscriptions: any[] = [];
    let customerName: string | null = null;

    if (customer) {
      const normalizedMac = macAddress.toUpperCase().replace(/[^A-F0-9]/g, '');
      const subs = customer.subscriptions.filter(
        s => (s.macAddress || '').toUpperCase().replace(/[^A-F0-9]/g, '') === normalizedMac
      );
      if (subs.length > 0) {
        // Resolve host URLs manually if they are ObjectIds
        const resolvedSubs = await Promise.all(subs.map(async (s) => {
          let hId = null;
          let hName = s.host;
          let hUrl = s.host;
          
          const isObjectIdString = typeof s.host === 'string' && /^[a-f\d]{24}$/i.test(s.host);
          const isObjectIdObject = s.host && typeof s.host === 'object' && !('url' in (s.host as any));

          if (isObjectIdObject || isObjectIdString) {
             // It's an ObjectId that wasn't populated
             try {
                const hostDoc = await this.hostsService.findOne((s.host as any).toString());
                if (hostDoc) {
                  hId = (hostDoc as any)._id;
                  hName = hostDoc.name;
                  hUrl = hostDoc.url;
                } else {
                  hName = '';
                  hUrl = '';
                }
             } catch(e) {
                hName = '';
                hUrl = '';
             }
          } else if (s.host && typeof s.host === 'object' && ('url' in (s.host as any))) {
             // It's already populated
             hId = (s.host as any)._id;
             hName = (s.host as any).name;
             hUrl = (s.host as any).url;
          }

          return {
            _id: (s as any)._id,
            status: s.status,
            username: s.username,
            password: s.password,
            hostId: hId,
            hostName: hName,
            hostUrl: hUrl,
            appActive: s.appActive,
            appExpiry: s.appExpiry,
          };
        }));
        subscriptions = resolvedSubs;
        customerName = customer.name;
      }
    }

    return {
      device: {
        macAddress: device.macAddress,
        customPlaylists: device.customPlaylists,
      },
      customerName: customerName,
      subscriptions: subscriptions,
    };
  }

  async deleteSubscription(macAddress: string, deviceKey: string, subId: string) {
    const device = await this.devicesService.findByMac(macAddress);
    if (!device || device.deviceKey !== deviceKey) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const customer = await this.customersService.findByMac(macAddress);
    if (!customer) throw new UnauthorizedException('العميل غير موجود');

    // Remove the subscription with this subId
    const updatedSubs = customer.subscriptions.filter(s => (s as any)._id.toString() !== subId);
    await this.customersService.update(customer._id.toString(), { subscriptions: updatedSubs as any });
    return { success: true };
  }

  async updateSubscription(macAddress: string, deviceKey: string, subId: string, data: any) {
    const device = await this.devicesService.findByMac(macAddress);
    if (!device || device.deviceKey !== deviceKey) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const customer = await this.customersService.findByMac(macAddress);
    if (!customer) throw new UnauthorizedException('العميل غير موجود');

    // Update the subscription
    const updatedSubs = customer.subscriptions.map(s => {
      if ((s as any)._id.toString() === subId) {
        return { ...s, ...data };
      }
      return s;
    });

    await this.customersService.update(customer._id.toString(), { subscriptions: updatedSubs as any });
    return { success: true };
  }

  async addSubscription(macAddress: string, deviceKey: string, data: any) {
    const device = await this.devicesService.findByMac(macAddress);
    if (!device || device.deviceKey !== deviceKey) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const customer = await this.customersService.findByMac(macAddress);
    if (!customer) throw new UnauthorizedException('العميل غير موجود');

    // Create a new subscription entry with a new ObjectId
    const mongoose = require('mongoose');
    const newSub = {
      _id: new mongoose.Types.ObjectId(),
      status: 'active',
      macAddress: macAddress,
      deviceKey: deviceKey,
      lastActive: new Date(),
      ...data, // contains username, password, host
    };

    const updatedSubs = [...customer.subscriptions, newSub];
    await this.customersService.update(customer._id.toString(), { subscriptions: updatedSubs as any });
    
    // Return the created sub format matching frontend expectations
    return { 
      success: true, 
      subscription: {
        _id: newSub._id.toString(),
        status: newSub.status,
        username: newSub.username,
        password: newSub.password,
        hostId: null,
        hostName: newSub.host,
        hostUrl: newSub.host,
      }
    };
  }

  async getPlaylists(macAddress: string, deviceKey: string) {
    return this.devicesService.getPlaylists(macAddress, deviceKey);
  }

  async updatePlaylists(macAddress: string, deviceKey: string, playlists: { name: string; url: string }[]) {
    return this.devicesService.updatePlaylists(macAddress, deviceKey, playlists);
  }
}
