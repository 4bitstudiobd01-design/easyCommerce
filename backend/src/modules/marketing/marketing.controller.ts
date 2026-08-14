import { Controller, Get, Query, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GetMarketingDashboardService } from './services/get-marketing-dashboard.service';
import { GetMarketingLogsService } from './services/get-marketing-logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Marketing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('marketing')
export class MarketingController {
  constructor(
    private readonly getDashboardService: GetMarketingDashboardService,
    private readonly getLogsService: GetMarketingLogsService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Marketing Dashboard KPIs and Integrations' })
  async getDashboard(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-store-id') storeId: string,
  ) {
    return this.getDashboardService.execute(tenantId, storeId);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get Marketing Event Logs' })
  async getLogs(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-store-id') storeId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.getLogsService.execute(tenantId, storeId, limit, offset);
  }
}
