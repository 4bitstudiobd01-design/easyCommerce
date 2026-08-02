import {
  Controller,
  Get,
  Headers,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GetMerchantAnalyticsService } from './services/get-merchant-analytics.service';
import { NetProfitService } from './services/net-profit.service';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';

@ApiTags('Analytics & Metrics')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly getMerchantAnalyticsService: GetMerchantAnalyticsService,
    private readonly netProfitService: NetProfitService,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  private async getMerchantTenantId(userId: string, storeId?: string): Promise<string> {
    const store = await this.findStoreByUserService.execute(userId, storeId);
    if (!store) {
      throw new BadRequestException('Merchant must create a store before viewing analytics.');
    }
    return store.tenantId;
  }

  @Get('overview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get merchant store sales analytics and revenue metrics' })
  @ApiResponse({ status: 200, description: 'Analytics metrics overview' })
  async getOverview(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.getMerchantAnalyticsService.execute(tenantId);
  }

  @Get('net-profit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get net profit margin and financial cost analytics' })
  @ApiResponse({ status: 200, description: 'Net profit metrics' })
  async getNetProfit(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.netProfitService.calculateNetProfit(tenantId);
  }
}
