import {
  Controller,
  Get,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GetMerchantAnalyticsService } from './services/get-merchant-analytics.service';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';

@ApiTags('Analytics & Metrics')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly getMerchantAnalyticsService: GetMerchantAnalyticsService,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  private async getMerchantTenantId(userId: string): Promise<string> {
    const store = await this.findStoreByUserService.execute(userId);
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
  async getOverview(@CurrentUser('sub') userId: string) {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.getMerchantAnalyticsService.execute(tenantId);
  }
}
