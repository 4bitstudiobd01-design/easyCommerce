import { Controller, Post, Get, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AbandonedCartService } from '../services/abandoned-cart.service';
import { FindStoreByUserService } from '../../tenant/services/find-store-by-user.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Abandoned Carts & Checkout Recovery')
@Controller('orders/abandoned-carts')
export class AbandonedCartController {
  constructor(
    private readonly abandonedCartService: AbandonedCartService,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  private async getMerchantTenantId(userId: string): Promise<string> {
    const store = await this.findStoreByUserService.execute(userId);
    if (!store) {
      throw new BadRequestException('Merchant must create a store first.');
    }
    return store.tenantId;
  }

  // Public endpoint to track incomplete checkout session
  @Post('track')
  @ApiOperation({ summary: 'Track incomplete customer checkout session' })
  async trackCart(
    @Body()
    dto: {
      customerName?: string;
      customerPhone: string;
      customerEmail?: string;
      shippingAddress?: string;
      itemsJson: any[];
      totalAmount: number;
      storeSlug: string;
    },
  ) {
    return this.abandonedCartService.trackIncompleteCart(dto);
  }

  // Merchant dashboard list
  @Get('merchant')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List abandoned carts for merchant store' })
  async getMerchantAbandonedCarts(@CurrentUser('sub') userId: string) {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.abandonedCartService.getMerchantAbandonedCarts(tenantId);
  }

  // Send 1-click recovery SMS
  @Post(':id/send-recovery-sms')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send 1-click Recovery SMS to customer' })
  async sendRecoverySms(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.abandonedCartService.sendRecoverySms(id, tenantId);
  }
}
