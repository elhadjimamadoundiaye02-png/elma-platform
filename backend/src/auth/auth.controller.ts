import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // Limité à 5 tentatives / minute pour prévenir le brute-force
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('otp/request')
  requestOtp(@Body('telephone') telephone: string) {
    return this.authService.requestOtp(telephone);
  }

  @Post('otp/verify')
  verifyOtp(@Body('telephone') telephone: string, @Body('code') code: string) {
    return this.authService.verifyOtp(telephone, code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  refresh(@CurrentUser() user, @Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(user.userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user) {
    return this.authService.logout(user.userId);
  }
}
