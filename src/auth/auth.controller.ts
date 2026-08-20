import { Controller, Post, Body, Get, Put, Delete, Param, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }

  @Post('setup')
  createAdmin(@Body() body: { username: string; password: string }) {
    return this.authService.createAdmin(body.username, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admins')
  getAdmins() {
    return this.authService.getAdmins();
  }

  @UseGuards(JwtAuthGuard)
  @Post('admins')
  addAdmin(@Body() body: { username: string; password: string }) {
    return this.authService.createAdmin(body.username, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Put('admins/:id')
  updateAdmin(@Param('id') id: string, @Body() body: { username?: string; password?: string }) {
    return this.authService.updateAdmin(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admins/:id')
  deleteAdmin(@Param('id') id: string) {
    return this.authService.deleteAdmin(id);
  }
}
