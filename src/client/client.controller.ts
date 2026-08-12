import { Controller, Post, Body } from '@nestjs/common';
import { ClientService } from './client.service';

@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post('auth')
  auth(@Body() body: { macAddress: string; deviceKey: string }) {
    return this.clientService.auth(body.macAddress, body.deviceKey);
  }
}
