import {
  Controller,
  Get,
  Headers,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GetMerchantAnalyticsService } from './services/get-merchant-analytics.service';
import { NetProfitService } from './services/net-profit.service';
import { GetAnalyticsKpiSummaryService } from './services/get-analytics-kpi-summary.service';
import { GetAnalyticsInsightsService } from './services/get-analytics-insights.service';
import { GetCustomerAnalyticsService } from '../customer/services/get-customer-analytics.service';
import { GetTrafficSourcesService } from '../tracking/services/get-traffic-sources.service';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { CustomerAnalyticsQueryDto } from '../customer/dto/customer-analytics.dto';

@ApiTags('Analytics & Metrics')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly getMerchantAnalyticsService: GetMerchantAnalyticsService,
    private readonly netProfitService: NetProfitService,
    private readonly getAnalyticsKpiSummaryService: GetAnalyticsKpiSummaryService,
    private readonly getAnalyticsInsightsService: GetAnalyticsInsightsService,
    private readonly getCustomerAnalyticsService: GetCustomerAnalyticsService,
    private readonly getTrafficSourcesService: GetTrafficSourcesService,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  private async getMerchantTenantId(userId: string, storeId?: string): Promise<string> {
    const store = await this.findStoreByUserService.execute(userId, storeId);
    if (!store) {
      throw new BadRequestException('Merchant must create a store before viewing analytics.');
    }
    return store.tenantId;
  }

  private parseDateRange(query: AnalyticsQueryDto): { dateFrom?: Date; dateTo?: Date } {
    return {
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    };
  }

  @Get('overview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get merchant store sales analytics and revenue metrics' })
  @ApiResponse({ status: 200, description: 'Analytics metrics overview' })
  async getOverview(
    @CurrentUser('sub') userId: string,
    @Query() query: AnalyticsQueryDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    const { dateFrom, dateTo } = this.parseDateRange(query);
    return this.getMerchantAnalyticsService.execute(tenantId, dateFrom, dateTo, query.compare);
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

  @Get('customers/new-vs-returning-trend')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Daily new-vs-returning order counts for the trailing N days' })
  @ApiResponse({ status: 200, description: 'New vs returning customer trend' })
  async getNewVsReturningTrend(
    @CurrentUser('sub') userId: string,
    @Query('days') days?: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    const parsedDays = days ? Math.min(Math.max(Number(days) || 7, 1), 366) : 7;
    return this.getCustomerAnalyticsService.getNewVsReturningTrend(tenantId, parsedDays);
  }

  @Get('customers/new-vs-returning-summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'New vs returning customer headcount split' })
  @ApiResponse({ status: 200, description: 'New vs returning customer summary' })
  async getNewVsReturningSummary(
    @CurrentUser('sub') userId: string,
    @Query() query: CustomerAnalyticsQueryDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.getCustomerAnalyticsService.getNewVsReturningSummary(tenantId, query);
  }

  @Get('traffic-sources')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Storefront visit sessions and conversion rate, broken down by channel (default), UTM source, or UTM campaign',
  })
  @ApiResponse({ status: 200, description: 'Traffic source breakdown' })
  async getTrafficSources(
    @CurrentUser('sub') userId: string,
    @Query() query: AnalyticsQueryDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    const { dateFrom, dateTo } = this.parseDateRange(query);
    const to = dateTo ?? new Date();
    const from = dateFrom ?? new Date(to.getTime() - 6 * 24 * 60 * 60 * 1000);
    return this.getTrafficSourcesService.execute(tenantId, from, to, query.groupBy ?? 'channel');
  }

  @Get('kpi-summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Combined KPI row: revenue, orders, AOV, customers, conversion rate, refunds' })
  @ApiResponse({ status: 200, description: 'KPI summary' })
  async getKpiSummary(
    @CurrentUser('sub') userId: string,
    @Query() query: AnalyticsQueryDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    const { dateFrom, dateTo } = this.parseDateRange(query);
    return this.getAnalyticsKpiSummaryService.execute(tenantId, dateFrom, dateTo);
  }

  @Get('insights')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Server-derived insight cards from real analytics signals only' })
  @ApiResponse({ status: 200, description: 'Insight list, 0-4 items depending on data availability' })
  async getInsights(
    @CurrentUser('sub') userId: string,
    @Query() query: AnalyticsQueryDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    const { dateFrom, dateTo } = this.parseDateRange(query);
    return this.getAnalyticsInsightsService.execute(tenantId, dateFrom, dateTo);
  }
}
