import { Controller, Post, Body, Headers, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../../common/types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('userinfo')
  async getUserInfo(@Headers('authorization') token: string) {
    const actualToken = token?.replace('Bearer ', '');
    return this.authService.getUserInfo(actualToken);
  }

  @Post('logout')
  logout(@Headers('authorization') token: string) {
    const actualToken = token?.replace('Bearer ', '');
    return this.authService.logout(actualToken);
  }
}
