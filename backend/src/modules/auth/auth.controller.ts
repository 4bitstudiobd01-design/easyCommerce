import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterMerchantService } from './services/register-merchant.service';
import { LoginService } from './services/login.service';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerMerchantService: RegisterMerchantService,
    private readonly loginService: LoginService,
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
}
