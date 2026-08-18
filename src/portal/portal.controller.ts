import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { PortalService } from './portal.service';

@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Post('login')
  login(@Body() body: { macAddress: string; deviceKey: string }) {
    return this.portalService.login(body.macAddress, body.deviceKey);
  }

  @Get('playlists')
  getPlaylists(
    @Query('macAddress') macAddress: string,
    @Query('deviceKey') deviceKey: string,
  ) {
    return this.portalService.getPlaylists(macAddress, deviceKey);
  }

  @Post('playlists')
  updatePlaylists(
    @Body() body: { macAddress: string; deviceKey: string; playlists: { name: string; url: string }[] },
  ) {
    return this.portalService.updatePlaylists(body.macAddress, body.deviceKey, body.playlists);
  }

  @Post('subscription/delete/:id')
  deleteSubscription(
    @Param('id') subId: string,
    @Body() body: { macAddress: string; deviceKey: string }
  ) {
    return this.portalService.deleteSubscription(body.macAddress, body.deviceKey, subId);
  }

  @Post('subscription/update/:id')
  updateSubscription(
    @Param('id') subId: string,
    @Body() body: { macAddress: string; deviceKey: string; data: any }
  ) {
    return this.portalService.updateSubscription(body.macAddress, body.deviceKey, subId, body.data);
  }

  @Post('subscription/add')
  addSubscription(
    @Body() body: { macAddress: string; deviceKey: string; data: any }
  ) {
    return this.portalService.addSubscription(body.macAddress, body.deviceKey, body.data);
  }
}
