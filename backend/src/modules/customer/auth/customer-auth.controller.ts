import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterCustomerService } from './services/register-customer.service';
import { CustomerLoginService } from './services/customer-login.service';
import { CustomerRefreshTokenService } from './services/customer-refresh-token.service';
import { FindStoreBySlugService } from '../../tenant/services/find-store-by-slug.service';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { RefreshTokenDto } from '../../auth/dto/refresh-token.dto';
import { CustomerAuthResponseDto } from './dto/customer-auth-response.dto';

@ApiTags('Storefront Customer Auth')
@Controller('storefront/:storeSlug/auth')
export class CustomerAuthController {
  constructor(
    private readonly registerCustomerService: RegisterCustomerService,
    private readonly customerLoginService: CustomerLoginService,
    private readonly customerRefreshTokenService: CustomerRefreshTokenService,
    private readonly findStoreBySlugService: FindStoreBySlugService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new storefront customer account' })
  @ApiResponse({ status: 201, type: CustomerAuthResponseDto, description: 'Customer successfully registered' })
  async register(
    @Param('storeSlug') storeSlug: string,
    @Body() dto: CustomerRegisterDto,
  ): Promise<CustomerAuthResponseDto> {
    const store = await this.findStoreBySlugService.execute(storeSlug);
    return this.registerCustomerService.execute(store.tenantId, store.id, dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Storefront customer login' })
  @ApiResponse({ status: 200, type: CustomerAuthResponseDto, description: 'Customer successfully logged in' })
  async login(
    @Param('storeSlug') storeSlug: string,
    @Body() dto: CustomerLoginDto,
  ): Promise<CustomerAuthResponseDto> {
    const store = await this.findStoreBySlugService.execute(storeSlug);
    return this.customerLoginService.execute(store.tenantId, dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a customer refresh token for a new access token' })
  @ApiResponse({ status: 200, type: CustomerAuthResponseDto, description: 'New access token issued' })
  @ApiResponse({ status: 401, description: 'Refresh token invalid, expired, or account disabled' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<CustomerAuthResponseDto> {
    return this.customerRefreshTokenService.execute(dto.refreshToken);
  }
}
