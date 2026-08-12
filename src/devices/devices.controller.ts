import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './create-device.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  findAll() {
    return this.devicesService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.devicesService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.devicesService.findOne(id);
  }

  @Post()
  create(@Body() body: CreateDeviceDto) {
    return this.devicesService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<CreateDeviceDto>) {
    return this.devicesService.update(id, body);
  }

  @Put(':id/host')
  assignHost(@Param('id') id: string, @Body() body: { hostId: string }) {
    return this.devicesService.assignHost(id, body.hostId);
  }

  @Put(':id/block')
  block(@Param('id') id: string) {
    return this.devicesService.block(id);
  }

  @Put(':id/unblock')
  unblock(@Param('id') id: string) {
    return this.devicesService.unblock(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.devicesService.remove(id);
  }
}
