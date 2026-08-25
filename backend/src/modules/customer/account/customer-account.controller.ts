import { Controller, Get, Patch, Body, Param, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CustomerJwtTypeGuard } from '../../../common/guards/customer-jwt-type.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { FindStoreBySlugService } from '../../tenant/services/find-store-by-slug.service';
import { GetMyProfileService } from './services/get-my-profile.service';
import { UpdateMyProfileService } from './services/update-my-profile.service';
import { ListMyOrdersService } from './services/list-my-orders.service';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { CustomerOrderListDto } from '../dto/customer-order-list.dto';
import { CustomerPayloadDto } from '../auth/dto/customer-auth-response.dto';

@ApiTags('Storefront Customer Account')
@ApiBearerAuth()
@Controller('storefront/:storeSlug/account')
@UseGuards(JwtAuthGuard, CustomerJwtTypeGuard)
export class CustomerAccountController {
  constructor(
    private readonly findStoreBySlugService: FindStoreBySlugService,
    private readonly getMyProfileService: GetMyProfileService,
    private readonly updateMyProfileService: UpdateMyProfileService,
    private readonly listMyOrdersService: ListMyOrdersService,
  ) {}

  /**
   * A customer JWT's tenantId/storeId are only proven-signed, not proven to
   * belong to the store named in the URL — a Store A customer JWT would
   * otherwise "work" on a Store B url within the same or another tenant.
   * Guards stay generic type-discriminators; this binding check lives here,
   * next to where the store is already being resolved.
   */
  private async resolveStoreForCustomer(storeSlug: string, tenantId: string) {
    const store = await this.findStoreBySlugService.execute(storeSlug);
    if (store.tenantId !== tenantId) {
      throw new UnauthorizedException('This session is not valid for this store.');
    }
    return store;
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated customer\'s own profile' })
  async getMe(
    @Param('storeSlug') storeSlug: string,
    @CurrentUser('sub') customerId: string,
    @CurrentUser('tenantId') tenantId: string,
  ): Promise<CustomerPayloadDto> {
    await this.resolveStoreForCustomer(storeSlug, tenantId);
    const customer = await this.getMyProfileService.execute(customerId, tenantId);
    return {
      id: customer.id,
      email: customer.email || '',
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
    };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the authenticated customer\'s own profile' })
  async updateMe(
    @Param('storeSlug') storeSlug: string,
    @CurrentUser('sub') customerId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: UpdateMyProfileDto,
  ): Promise<CustomerPayloadDto> {
    await this.resolveStoreForCustomer(storeSlug, tenantId);
    const customer = await this.updateMyProfileService.execute(customerId, tenantId, dto);
    return {
      id: customer.id,
      email: customer.email || '',
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
    };
  }

  @Get('orders')
  @ApiOperation({ summary: 'List the authenticated customer\'s own orders' })
  async getMyOrders(
    @Param('storeSlug') storeSlug: string,
    @CurrentUser('sub') customerId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query() dto: CustomerOrderListDto,
  ) {
    await this.resolveStoreForCustomer(storeSlug, tenantId);
    return this.listMyOrdersService.execute(customerId, tenantId, storeSlug, dto);
  }
}
