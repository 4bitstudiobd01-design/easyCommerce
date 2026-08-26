import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterMerchantService } from './services/register-merchant.service';
import { LoginService } from './services/login.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { RequestPasswordResetService } from './services/request-password-reset.service';
import { ResetPasswordService } from './services/reset-password.service';
import { ListDevMerchantsService } from './services/list-dev-merchants.service';
import { DevLoginAsMerchantService } from './services/dev-login-as-merchant.service';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetMessageDto } from './dto/password-reset-message.dto';
import { DevLoginAsDto } from './dto/dev-login-as.dto';
import { DevMerchantListItemDto } from './dto/dev-merchant-list-item.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerMerchantService: RegisterMerchantService,
    private readonly loginService: LoginService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly requestPasswordResetService: RequestPasswordResetService,
    private readonly resetPasswordService: ResetPasswordService,
    private readonly listDevMerchantsService: ListDevMerchantsService,
    private readonly devLoginAsMerchantService: DevLoginAsMerchantService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new merchant (Store Owner)' })
  @ApiResponse({ status: 201, type: AuthResponseDto, description: 'Merchant successfully registered' })
  async register(@Body() dto: RegisterMerchantDto): Promise<AuthResponseDto> {
    return this.registerMerchantService.execute(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User / Merchant login' })
  @ApiResponse({ status: 200, type: AuthResponseDto, description: 'User successfully logged in' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.loginService.execute(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new access token' })
  @ApiResponse({ status: 200, type: AuthResponseDto, description: 'New access token issued' })
  @ApiResponse({ status: 401, description: 'Refresh token invalid, expired, or account disabled' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.refreshTokenService.execute(dto.refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset OTP via email' })
  @ApiResponse({
    status: 200,
    type: PasswordResetMessageDto,
    description: 'Generic success — same response whether or not the email exists',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.requestPasswordResetService.execute(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using the emailed OTP' })
  @ApiResponse({ status: 200, type: PasswordResetMessageDto, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid/expired OTP, too many attempts, or cooldown active' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.resetPasswordService.execute(dto);
  }

  @Get('dev/merchants')
  @ApiOperation({ summary: '[DEV ONLY] List merchant accounts for the dev merchant switcher' })
  @ApiResponse({ status: 200, type: [DevMerchantListItemDto] })
  @ApiResponse({ status: 403, description: 'Disabled in production environments' })
  async listDevMerchants(): Promise<DevMerchantListItemDto[]> {
    return this.listDevMerchantsService.execute();
  }

  @Post('dev/login-as')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[DEV ONLY] Log in as a chosen merchant, no password required' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 403, description: 'Disabled in production, or target is not an active merchant account' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async devLoginAs(@Body() dto: DevLoginAsDto): Promise<AuthResponseDto> {
    return this.devLoginAsMerchantService.execute(dto.userId);
  }
}
