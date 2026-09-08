import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GetMarketingDashboardService } from './services/get-marketing-dashboard.service';
import { ConnectPixelService } from './services/connect-pixel.service';
import { DisconnectPixelService } from './services/disconnect-pixel.service';
import { ListAdSpendService } from './services/list-ad-spend.service';
import { UpsertAdSpendService } from './services/upsert-ad-spend.service';
import { DeleteAdSpendService } from './services/delete-ad-spend.service';
import { GetSourceSalesReportService } from './services/get-source-sales-report.service';
import { ConnectPixelDto } from './dto/connect-pixel.dto';
import { UpsertAdSpendDto, ListAdSpendQueryDto, SourceSalesQueryDto } from './dto/ad-spend.dto';
import { MarketingProviderEnum } from './entities/marketing-pixel.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('Marketing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('marketing')
export class MarketingController {
  constructor(
    private readonly getDashboardService: GetMarketingDashboardService,
    private readonly connectPixelService: ConnectPixelService,
    private readonly disconnectPixelService: DisconnectPixelService,
    private readonly listAdSpendService: ListAdSpendService,
    private readonly upsertAdSpendService: UpsertAdSpendService,
    private readonly deleteAdSpendService: DeleteAdSpendService,
    private readonly getSourceSalesReportService: GetSourceSalesReportService,
  ) {}

  /** Report window: explicit dates, else the trailing 7 days (matches analytics). */
  private resolveWindow(query: SourceSalesQueryDto): { from: Date; to: Date } {
    const to = query.dateTo ? new Date(query.dateTo) : new Date();
    const from = query.dateFrom
      ? new Date(query.dateFrom)
      : new Date(to.getTime() - 6 * 24 * 60 * 60 * 1000);
    return { from, to };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Marketing Dashboard KPIs and Integrations' })
  async getDashboard(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-store-id') storeId: string,
  ) {
    return this.getDashboardService.execute(tenantId, storeId);
  }

  @Post('pixels/connect')
  @ApiOperation({ summary: 'Connect or update a marketing pixel' })
  async connectPixel(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-store-id') storeId: string,
    @Body() dto: ConnectPixelDto,
  ) {
    return this.connectPixelService.execute(tenantId, storeId, dto);
  }

  @Delete('pixels/:provider/disconnect')
  @ApiOperation({ summary: 'Disconnect a marketing pixel' })
  async disconnectPixel(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-store-id') storeId: string,
    @Param('provider') provider: MarketingProviderEnum,
  ) {
    return this.disconnectPixelService.execute(tenantId, storeId, provider);
  }

  // --- Ad spend (Sales-by-Source report, Phase A) ---

  @Get('ad-spend')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('marketing:read')
  @ApiOperation({ summary: 'List merchant-entered advertising spend entries' })
  async listAdSpend(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-store-id') storeId: string,
    @Query() query: ListAdSpendQueryDto,
  ) {
    return this.listAdSpendService.execute(tenantId, storeId, query);
  }

  @Put('ad-spend')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('marketing:manage')
  @ApiOperation({ summary: 'Create or update one advertising spend entry' })
  async upsertAdSpend(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-store-id') storeId: string,
    @Body() dto: UpsertAdSpendDto,
  ) {
    return this.upsertAdSpendService.execute(tenantId, storeId, dto);
  }

  @Delete('ad-spend/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('marketing:manage')
  @ApiOperation({ summary: 'Delete one advertising spend entry' })
  async deleteAdSpend(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-store-id') storeId: string,
    @Param('id') id: string,
  ) {
    return this.deleteAdSpendService.execute(tenantId, storeId, id);
  }

  @Get('attribution/source-sales')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('marketing:read')
  @ApiOperation({
    summary:
      'Sales-by-Source report: sessions, orders, revenue, conversion rate, ad spend, ROAS and CPA per channel / UTM source / UTM campaign',
  })
  async getSourceSales(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-store-id') storeId: string,
    @Query() query: SourceSalesQueryDto,
  ) {
    const { from, to } = this.resolveWindow(query);
    return this.getSourceSalesReportService.execute(
      tenantId,
      storeId,
      from,
      to,
      query.groupBy ?? 'channel',
    );
  }
}
