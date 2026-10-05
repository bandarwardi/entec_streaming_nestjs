import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service';
import { CustomersService } from '../customers/customers.service';
import { HostsService } from '../hosts/hosts.service';
import * as bcrypt from 'bcrypt';
import { NotFoundException, BadRequestException } from '@nestjs/common';

@Injectable()
export class PortalService {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly customersService: CustomersService,
    private readonly hostsService: HostsService,
  ) {}

  private publicPlaylists(playlists: any[] = []) {
    return playlists.map((playlist) => {
      const { pinHash, ...safe } = playlist.toObject ? playlist.toObject() : playlist;
      return pinHash ? { ...safe, url: undefined, isLocked: true } : { ...safe, isLocked: false };
    });
  }

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

          if ((s as any).playlistPinHash) {
            return { _id: (s as any)._id, playlistName: s.playlistName || hName || 'اشتراك Xtream', status: s.status, appActive: s.appActive, appExpiry: s.appExpiry, isLocked: true };
          }

          return {
            _id: (s as any)._id,
            playlistName: s.playlistName || hName || 'اشتراك Xtream',
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
        customPlaylists: this.publicPlaylists(device.customPlaylists),
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

  async unlockSubscription(macAddress: string, deviceKey: string, subId: string, pin: string) {
    const device = await this.devicesService.findByMac(macAddress);
    if (!device || device.deviceKey !== deviceKey) throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    const customer = await this.customersService.findByMac(macAddress);
    if (!customer) throw new NotFoundException('العميل غير موجود');
    const normalizedMac = macAddress.toUpperCase().replace(/[^A-F0-9]/g, '');
    const subscription: any = (customer.subscriptions as any[]).find((item) =>
      item._id.toString() === subId && (item.macAddress || '').toUpperCase().replace(/[^A-F0-9]/g, '') === normalizedMac,
    );
    if (!subscription) throw new NotFoundException('الاشتراك غير موجود');
    if (!subscription.playlistPinHash || !pin || !(await bcrypt.compare(pin, subscription.playlistPinHash))) {
      throw new UnauthorizedException('رمز PIN غير صحيح');
    }
    const host = subscription.host;
    let hostId: any = null;
    let hostName: any = host;
    let hostUrl: any = host;
    if (host && typeof host === 'object' && 'url' in host) {
      hostId = host._id;
      hostName = host.name;
      hostUrl = host.url;
    } else if (typeof host === 'string' && /^[a-f\d]{24}$/i.test(host)) {
      const hostDoc = await this.hostsService.findOne(host);
      if (hostDoc) { hostId = (hostDoc as any)._id; hostName = hostDoc.name; hostUrl = hostDoc.url; }
    }
    return { playlistName: subscription.playlistName || hostName || 'اشتراك Xtream', username: subscription.username, password: subscription.password, hostId, hostName, hostUrl };
  }

  async setSubscriptionPin(macAddress: string, deviceKey: string, subId: string, pin: string | null, currentPin?: string) {
    const device = await this.devicesService.findByMac(macAddress);
    if (!device || device.deviceKey !== deviceKey) throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    const customer = await this.customersService.findByMac(macAddress);
    if (!customer) throw new NotFoundException('العميل غير موجود');
    const normalizedMac = macAddress.toUpperCase().replace(/[^A-F0-9]/g, '');
    const subscription: any = (customer.subscriptions as any[]).find((item) =>
      item._id.toString() === subId && (item.macAddress || '').toUpperCase().replace(/[^A-F0-9]/g, '') === normalizedMac,
    );
    if (!subscription) throw new NotFoundException('الاشتراك غير موجود');
    if (subscription.playlistPinHash && (!currentPin || !(await bcrypt.compare(currentPin, subscription.playlistPinHash)))) {
      throw new UnauthorizedException('رمز PIN الحالي غير صحيح');
    }
    if (pin !== null && !/^\d{4,8}$/.test(String(pin))) throw new BadRequestException('يجب أن يتكون PIN من 4 إلى 8 أرقام');
    const updated = (customer.subscriptions as any[]).map((item) => item._id.toString() === subId && (item.macAddress || '').toUpperCase().replace(/[^A-F0-9]/g, '') === normalizedMac
      ? { ...item.toObject(), playlistPin: pin }
      : item);
    await this.customersService.update(customer._id.toString(), { subscriptions: updated as any });
    return { success: true, isLocked: Boolean(pin) };
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

    const { playlistPin: _ignoredPin, playlistPinHash: _ignoredPinHash, ...safeData } = data || {};

    // Update the subscription; PIN changes are managed only through admin controls.
    const updatedSubs = customer.subscriptions.map(s => {
      if ((s as any)._id.toString() === subId) {
        return { ...s, ...safeData, ...(hostValue !== undefined ? { host: hostValue } : {}) };
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
      playlistName: String(data.playlistName || data.name || data.username || hName || 'اشتراك Xtream').trim(),
      password: data.password,
      host: hostValue,
      ...(data.playlistPin ? { playlistPin: data.playlistPin } : {}),
      appActive: true,
      appExpiry: null,
    };

    if (!customer) {
      // Use the IPTV username as the customer name in the users portal.
      customer = await this.customersService.create({
        name: String(data.username || device.macAddress),
        status: 'active',
        subscriptions: [newSub],
      } as any);
    } else {
      const updatedSubs = [...customer.subscriptions, newSub];
      const isMacName = /^[0-9a-f]{2}([:-]?[0-9a-f]{2}){5}$/i.test(customer.name || '');
      await this.customersService.update(customer._id.toString(), {
        subscriptions: updatedSubs as any,
        ...(isMacName && data.username ? { name: String(data.username) } : {}),
      } as any);
    }
    
    // Return the created sub format matching frontend expectations
    return { 
      success: true, 
      subscription: {
        _id: newSub._id.toString(),
        status: newSub.status,
        username: newSub.username,
        playlistName: newSub.playlistName,
        password: newSub.password,
        hostId: hId,
        hostName: hName,
        hostUrl: hUrl,
        isLocked: Boolean(data.playlistPin),
      }
    };
  }

  async getPlaylists(macAddress: string, deviceKey: string) {
    const playlists = await this.devicesService.getPlaylists(macAddress, deviceKey);
    return this.publicPlaylists(playlists as any[]);
  }

  async getAdminPlaylists(macAddress: string) {
    const device = await this.devicesService.findByMac(macAddress);
    if (!device) throw new NotFoundException('الجهاز غير مسجل');
    return (device.customPlaylists || []).map((playlist: any) => {
      const { pinHash, ...data } = playlist.toObject ? playlist.toObject() : playlist;
      return { ...data, isLocked: Boolean(pinHash) };
    });
  }

  async unlockPlaylist(macAddress: string, deviceKey: string, playlistId: string, pin: string) {
    const device = await this.devicesService.findByMac(macAddress);
    if (!device || device.deviceKey !== deviceKey) throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    const playlist: any = (device.customPlaylists as any[]).find((item) => item._id.toString() === playlistId);
    if (!playlist) throw new NotFoundException('القائمة غير موجودة');
    if (!playlist.pinHash) return { url: playlist.url };
    if (!pin || !(await bcrypt.compare(pin, playlist.pinHash))) throw new UnauthorizedException('رمز PIN غير صحيح');
    return { url: playlist.url };
  }

  async setPlaylistPin(macAddress: string, deviceKey: string, playlistId: string, pin: string | null, currentPin?: string) {
    const device = await this.devicesService.findByMac(macAddress);
    if (!device || device.deviceKey !== deviceKey) throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    const playlist: any = (device.customPlaylists as any[]).find((item) => item._id.toString() === playlistId);
    if (!playlist) throw new NotFoundException('القائمة غير موجودة');
    if (playlist.pinHash && (!currentPin || !(await bcrypt.compare(currentPin, playlist.pinHash)))) {
      throw new UnauthorizedException('رمز PIN الحالي غير صحيح');
    }
    if (pin !== null && (!/^\d{4,8}$/.test(pin))) throw new BadRequestException('يجب أن يتكون PIN من 4 إلى 8 أرقام');
    playlist.pinHash = pin ? await bcrypt.hash(pin, 10) : undefined;
    await device.save();
    return { success: true, isLocked: Boolean(pin) };
  }

  async updatePlaylists(macAddress: string, deviceKey: string, playlists: { name: string; url: string }[]) {
    const device = await this.devicesService.findByMac(macAddress);
    if (!device || device.deviceKey !== deviceKey) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const previous = (device.customPlaylists || []) as any[];
    const preserved = (playlists || []).map((playlist: any) => {
      const old = playlist._id ? previous.find((item) => item._id.toString() === playlist._id) : null;
      return old ? {
        ...playlist,
        url: playlist.url ?? old.url,
        ...(old.pinHash ? { pinHash: old.pinHash } : {}),
      } : playlist;
    });
    const updated = await this.devicesService.updatePlaylists(macAddress, deviceKey, preserved);

    // If client added playlists, ensure customer exists in admin panel
    if (playlists && playlists.length > 0) {
      let customer = await this.customersService.findByMac(macAddress);
      if (!customer) {
        await this.customersService.create({
          name: String((playlists as any[]).find((playlist) => playlist.username)?.username || device.macAddress),
          status: 'active',
          subscriptions: [],
        } as any);
      }
    }
    return this.publicPlaylists(updated as any[]);
  }

  async getHosts() {
    return this.hostsService.findAll();
  }
}
