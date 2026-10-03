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

    let hostValue = data.host;
    if (hostValue) {
      const allHosts = await this.hostsService.findAll();
      const cleanInput = String(hostValue).trim().replace(/\/+$/, '').toLowerCase();
      const matchedHost = allHosts.find(h => 
        h.url?.replace(/\/+$/, '').toLowerCase() === cleanInput ||
        h.name?.toLowerCase() === cleanInput ||
        (cleanInput.includes('://') && h.url && cleanInput.split('://')[1] === h.url.replace(/\/+$/, '').split('://')[1])
      );
      if (matchedHost) {
        hostValue = (matchedHost as any)._id;
      } else {
        hostValue = String(data.host).trim();
      }
    }

    // Update the subscription
    const updatedSubs = customer.subscriptions.map(s => {
      if ((s as any)._id.toString() === subId) {
        return { ...s, ...data, ...(hostValue !== undefined ? { host: hostValue } : {}) };
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

    let customer: any = await this.customersService.findByMac(macAddress);

    // Check if host matches any registered Host in hosts collection
    let hostValue = data.host;
    let hName = data.host;
    let hUrl = data.host;
    let hId: any = null;

    if (hostValue) {
      const allHosts = await this.hostsService.findAll();
      const cleanInput = String(hostValue).trim().replace(/\/+$/, '').toLowerCase();
      const matchedHost = allHosts.find(h => 
        h.url?.replace(/\/+$/, '').toLowerCase() === cleanInput ||
        h.name?.toLowerCase() === cleanInput ||
        (cleanInput.includes('://') && h.url && cleanInput.split('://')[1] === h.url.replace(/\/+$/, '').split('://')[1])
      );
      if (matchedHost) {
        hId = (matchedHost as any)._id;
        hName = matchedHost.name;
        hUrl = matchedHost.url;
        hostValue = hId;
      } else {
        hostValue = String(data.host).trim();
      }
    }

    // Create a new subscription entry with a new ObjectId
    const mongoose = require('mongoose');
    const newSub = {
      _id: new mongoose.Types.ObjectId(),
      status: 'active',
      macAddress: device.macAddress,
      deviceKey: device.deviceKey,
      lastActive: new Date(),
      username: data.username,
      password: data.password,
      host: hostValue,
      appActive: true,
      appExpiry: null,
    };

    if (!customer) {
      // Auto-create customer in admin panel with MAC address as default name
      customer = await this.customersService.create({
        name: device.macAddress,
        status: 'active',
        subscriptions: [newSub],
      } as any);
    } else {
      const updatedSubs = [...customer.subscriptions, newSub];
      await this.customersService.update(customer._id.toString(), { subscriptions: updatedSubs as any });
    }
    
    // Return the created sub format matching frontend expectations
    return { 
      success: true, 
      subscription: {
        _id: newSub._id.toString(),
        status: newSub.status,
        username: newSub.username,
        password: newSub.password,
        hostId: hId,
        hostName: hName,
        hostUrl: hUrl,
      }
    };
  }

  async getPlaylists(macAddress: string, deviceKey: string) {
    return this.devicesService.getPlaylists(macAddress, deviceKey);
  }

  async updatePlaylists(macAddress: string, deviceKey: string, playlists: { name: string; url: string }[]) {
    const device = await this.devicesService.findByMac(macAddress);
    if (!device || device.deviceKey !== deviceKey) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const updated = await this.devicesService.updatePlaylists(macAddress, deviceKey, playlists);

    // If client added playlists, ensure customer exists in admin panel
    if (playlists && playlists.length > 0) {
      let customer = await this.customersService.findByMac(macAddress);
      if (!customer) {
        await this.customersService.create({
          name: device.macAddress,
          status: 'active',
          subscriptions: [],
        } as any);
      }
    }
    return updated;
  }

  async getHosts() {
    return this.hostsService.findAll();
  }
}
