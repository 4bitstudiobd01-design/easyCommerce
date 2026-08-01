import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCouponService } from './services/create-coupon.service';
import { ListMerchantCouponsService } from './services/list-merchant-coupons.service';
import { ValidatePublicCouponService } from './services/validate-public-coupon.service';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';
import { CreateCouponDto } from './dto/create-coupon.dto';

@ApiTags('Merchant Coupons & Promo Codes')
@Controller('coupons')
export class CouponController {
  constructor(
    private readonly createCouponService: CreateCouponService,
    private readonly listMerchantCouponsService: ListMerchantCouponsService,
    private readonly validatePublicCouponService: ValidatePublicCouponService,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new promo discount coupon' })
  @ApiResponse({ status: 201, description: 'Coupon created successfully' })
  async createCoupon(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateCouponDto,
  ) {
    const store = await this.findStoreByUserService.execute(userId);
    if (!store) {
      throw new BadRequestException('Merchant store not found.');
    }
    return this.createCouponService.execute(store.tenantId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all promo coupons for merchant store' })
  @ApiResponse({ status: 200, description: 'List of store coupons' })
  async listCoupons(@CurrentUser('sub') userId: string) {
    const store = await this.findStoreByUserService.execute(userId);
    if (!store) {
      throw new BadRequestException('Merchant store not found.');
    }
    return this.listMerchantCouponsService.execute(store.tenantId);
  }

  @Post('public/validate')
  @ApiOperation({ summary: 'Validate public customer promo coupon on checkout' })
  @ApiResponse({ status: 200, description: 'Coupon validation result' })
  async validateCoupon(
    @Body('storeSlug') storeSlug: string,
    @Body('code') code: string,
    @Body('subtotal') subtotal: number,
  ) {
    if (!storeSlug || !code) {
      throw new BadRequestException('Store slug and coupon code are required.');
    }
    return this.validatePublicCouponService.execute(storeSlug, code, subtotal || 0);
  }
}
