import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AppUpdatesService } from './app-updates.service';
import type { SaveAppUpdateInput } from './app-updates.service';
import { APP_UPDATE_PLATFORMS, AppUpdatePlatform } from '../schemas/app-update.schema';

@Controller('app-updates')
export class AppUpdatesController {
  constructor(private readonly appUpdatesService: AppUpdatesService) {}

  @Get('latest')
  getLatestWindowsUpdate() {
    return this.appUpdatesService.getLatestUpdate('windows');
  }

  @Get('latest/:platform')
  getLatestUpdate(@Param('platform') platform: string) {
    if (!APP_UPDATE_PLATFORMS.includes(platform as AppUpdatePlatform)) return null;
    return this.appUpdatesService.getLatestUpdate(platform as AppUpdatePlatform);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllUpdates() {
    const updates = await this.appUpdatesService.getAllUpdates();
    return { updates };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':platform')
  async saveUpdate(@Param('platform') platform: string, @Body() body: SaveAppUpdateInput) {
    if (!APP_UPDATE_PLATFORMS.includes(platform as AppUpdatePlatform)) return null;
    const update = await this.appUpdatesService.saveUpdate(platform as AppUpdatePlatform, body);
    return { success: true, update };
  }
}
