import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserRole } from '@bulkkx/shared';

class RequestOtpDto {
  @ApiProperty({ example: '+919876543210', description: 'Indian mobile phone number' })
  phone!: string;
}

class VerifyOtpDto {
  @ApiProperty({ example: '+919876543210' })
  phone!: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  otp!: string;

  @ApiProperty({ enum: ['buyer', 'supplier'], default: 'buyer' })
  role?: UserRole;

  @ApiProperty({ example: 'Shree Agro Traders', required: false })
  legalName?: string;
}

class StaffLoginDto {
  @ApiProperty({ example: 'admin@bulkkx.internal' })
  email!: string;

  @ApiProperty({ example: 'BulkkXAdmin2026!' })
  password!: string;

  @ApiProperty({ example: '123456', required: false })
  totpCode?: string;
}

@ApiTags('auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request 6-digit OTP for phone login' })
  @ApiResponse({ status: 200, description: 'OTP dispatched successfully' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.phone);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code and receive JWT Bearer token' })
  @ApiResponse({ status: 200, description: 'Authentication successful with JWT' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.otp, dto.role, dto.legalName);
  }

  @Post('staff/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Staff login using email, Argon2 password and optional 2FA TOTP' })
  @ApiResponse({ status: 200, description: 'Staff authenticated' })
  async staffLogin(@Body() dto: StaffLoginDto) {
    return this.authService.staffLogin(dto.email, dto.password, dto.totpCode);
  }
}
