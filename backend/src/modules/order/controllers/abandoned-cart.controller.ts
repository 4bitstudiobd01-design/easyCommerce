import { Controller, Post, Get, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AbandonedCartService } from '../services/abandoned-cart.service';
import { SeedAbandonedCartDemoDataService } from '../services/seed-abandoned-cart-demo-data.service';
import { FindStoreByUserService } from '../../tenant/services/find-store-by-user.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { TrackAbandonedCartDto } from '../dto/track-abandoned-cart.dto';

@ApiTags('Abandoned Carts & Checkout Recovery')
@Controller('orders/abandoned-carts')
export class AbandonedCartController {
  constructor(
    private readonly abandonedCartService: AbandonedCartService,
    private readonly seedAbandonedCartDemoDataService: SeedAbandonedCartDemoDataService,
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
  @ApiResponse({ status: 201, description: 'Abandoned cart tracked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid tracking payload' })
  async trackCart(@Body() dto: TrackAbandonedCartDto) {
    return this.abandonedCartService.trackIncompleteCart(dto);
  }

  // Merchant dashboard list
  @Get('merchant')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List abandoned carts for merchant store' })
  @ApiResponse({ status: 200, description: 'List of abandoned carts for the merchant store' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 400, description: 'Merchant has not created a store yet' })
  async getMerchantAbandonedCarts(@CurrentUser('sub') userId: string) {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.abandonedCartService.getMerchantAbandonedCarts(tenantId);
  }

  // Seed demo abandoned carts (dev only)
  @Post('seed-demo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed demo abandoned carts (dev only)' })
  @ApiResponse({ status: 201, description: 'Seed result with counts' })
  async seedDemo(@CurrentUser('sub') userId: string) {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.seedAbandonedCartDemoDataService.execute(tenantId);
  }

  // Send 1-click recovery SMS
  @Post(':id/send-recovery-sms')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send 1-click Recovery SMS to customer' })
  @ApiResponse({ status: 201, description: 'Recovery SMS sent successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 400, description: 'Merchant has not created a store yet' })
  async sendRecoverySms(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.abandonedCartService.sendRecoverySms(id, tenantId);
  }
}
