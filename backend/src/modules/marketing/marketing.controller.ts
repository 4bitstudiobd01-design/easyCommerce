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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GetMarketingDashboardService } from './services/get-marketing-dashboard.service';
import { ListAdSpendService } from './services/list-ad-spend.service';
import { UpsertAdSpendService } from './services/upsert-ad-spend.service';
import { DeleteAdSpendService } from './services/delete-ad-spend.service';
import { GetSourceSalesReportService } from './services/get-source-sales-report.service';
import { ListPixelsService } from './services/list-pixels.service';
import { GetPixelService } from './services/get-pixel.service';
import { CreatePixelService } from './services/create-pixel.service';
import { UpdatePixelService } from './services/update-pixel.service';
import { DeletePixelService } from './services/delete-pixel.service';
import { TestPixelEventService } from './services/test-pixel-event.service';
import { GetPageRulesService } from './services/get-page-rules.service';
import { ReplacePageRulesService } from './services/replace-page-rules.service';
import { ListMarketingLogsService } from './services/list-marketing-logs.service';
import { ListMarketingLogsDto } from './dto/list-logs.dto';
import { CreatePixelDto, UpdatePixelDto, TestPixelEventDto } from './dto/pixel.dto';
import { ReplacePageRulesDto } from './dto/page-rule.dto';
import { UpsertAdSpendDto, ListAdSpendQueryDto, SourceSalesQueryDto } from './dto/ad-spend.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';

@ApiTags('Marketing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('marketing')
export class MarketingController {
  constructor(
    private readonly getDashboardService: GetMarketingDashboardService,
    private readonly listAdSpendService: ListAdSpendService,
    private readonly upsertAdSpendService: UpsertAdSpendService,
    private readonly deleteAdSpendService: DeleteAdSpendService,
    private readonly getSourceSalesReportService: GetSourceSalesReportService,
    private readonly listPixelsService: ListPixelsService,
    private readonly getPixelService: GetPixelService,
    private readonly createPixelService: CreatePixelService,
    private readonly updatePixelService: UpdatePixelService,
    private readonly deletePixelService: DeletePixelService,
    private readonly testPixelEventService: TestPixelEventService,
    private readonly getPageRulesService: GetPageRulesService,
    private readonly replacePageRulesService: ReplacePageRulesService,
    private readonly listMarketingLogsService: ListMarketingLogsService,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  /**
   * Resolves the caller's active store server-side (never trusts a client-sent
   * tenant id), mirroring AnalyticsController. `x-store-id` only narrows which
   * store a multi-store merchant means.
   */
  private async resolveScope(
    userId: string,
    storeId?: string,
  ): Promise<{ tenantId: string; storeId: string }> {
    const store = await this.findStoreByUserService.execute(userId, storeId);
    if (!store) {
      throw new BadRequestException('Merchant must create a store before using marketing tools.');
    }
    return { tenantId: store.tenantId, storeId: store.id };
  }

  /** Report window: explicit dates, else the trailing 7 days (matches analytics). */
  private resolveWindow(query: SourceSalesQueryDto): { from: Date; to: Date } {
    const to = query.dateTo ? new Date(query.dateTo) : new Date();
    const from = query.dateFrom
      ? new Date(query.dateFrom)
      : new Date(to.getTime() - 6 * 24 * 60 * 60 * 1000);
    return { from, to };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Marketing Dashboard KPIs' })
  async getDashboard(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const scope = await this.resolveScope(userId, storeId);
    return this.getDashboardService.execute(scope.tenantId, scope.storeId);
  }

  // --- Multi-instance pixel CRUD (Phase 1) ---

  @Get('pixels')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('marketing:read')
  @ApiOperation({ summary: 'List every configured pixel instance for the store' })
  async listPixels(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const scope = await this.resolveScope(userId, storeId);
    return this.listPixelsService.execute(scope.tenantId, scope.storeId);
  }

  @Post('pixels')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('marketing:manage')
  @ApiOperation({ summary: 'Create a pixel instance (same provider may be added more than once)' })
  async createPixel(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreatePixelDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const scope = await this.resolveScope(userId, storeId);
    return this.createPixelService.execute(scope.tenantId, scope.storeId, dto);
  }

  @Get('pixels/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('marketing:read')
  @ApiOperation({ summary: 'Get one pixel instance with its page rules' })
  async getPixel(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const scope = await this.resolveScope(userId, storeId);
    return this.getPixelService.execute(scope.tenantId, scope.storeId, id);
  }

  @Put('pixels/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('marketing:manage')
  @ApiOperation({ summary: 'Update a pixel instance (omit credentials to keep stored secrets)' })
  async updatePixel(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePixelDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const scope = await this.resolveScope(userId, storeId);
    return this.updatePixelService.execute(scope.tenantId, scope.storeId, id, dto);
  }

  @Delete('pixels/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('marketing:manage')
  @ApiOperation({ summary: 'Delete a pixel instance (page rules cascade, event history kept)' })
  async deletePixel(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const scope = await this.resolveScope(userId, storeId);
    return this.deletePixelService.execute(scope.tenantId, scope.storeId, id);
  }

  @Post('pixels/:id/test')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('marketing:manage')
  @ApiOperation({ summary: 'Fire one simulated event through this pixel' })
  async testPixel(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: TestPixelEventDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const scope = await this.resolveScope(userId, storeId);
    return this.testPixelEventService.execute(scope.tenantId, scope.storeId, id, dto);
  }

  @Post('pixels/test-all')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('marketing:manage')
  @ApiOperation({ summary: 'Fire a PageView through every connected + active pixel' })
  async testAllPixels(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const scope = await this.resolveScope(userId, storeId);
    return this.testPixelEventService.testAll(scope.tenantId, scope.storeId);
  }

  @Get('pixels/:id/page-rules')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('marketing:read')
  @ApiOperation({ summary: 'List a pixel\'s page-targeting rules' })
  async getPageRules(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const scope = await this.resolveScope(userId, storeId);
    return this.getPageRulesService.execute(scope.tenantId, scope.storeId, id);
  }

  @Put('pixels/:id/page-rules')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('marketing:manage')
  @ApiOperation({ summary: 'Replace a pixel\'s full page-rule set (atomic)' })
  async replacePageRules(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: ReplacePageRulesDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const scope = await this.resolveScope(userId, storeId);
    return this.replacePageRulesService.execute(scope.tenantId, scope.storeId, id, dto);
  }

  // --- Ad spend (Sales-by-Source report, Phase A) ---

  @Get('ad-spend')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('marketing:read')
  @ApiOperation({ summary: 'List merchant-entered advertising spend entries' })
  async listAdSpend(
    @CurrentUser('sub') userId: string,
    @Query() query: ListAdSpendQueryDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const scope = await this.resolveScope(userId, storeId);
    return this.listAdSpendService.execute(scope.tenantId, scope.storeId, query);
  }

  @Put('ad-spend')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('marketing:manage')
  @ApiOperation({ summary: 'Create or update one advertising spend entry' })
  async upsertAdSpend(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpsertAdSpendDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const scope = await this.resolveScope(userId, storeId);
    return this.upsertAdSpendService.execute(scope.tenantId, scope.storeId, dto);
  }

  @Delete('ad-spend/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('marketing:manage')
  @ApiOperation({ summary: 'Delete one advertising spend entry' })
  async deleteAdSpend(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const scope = await this.resolveScope(userId, storeId);
    return this.deleteAdSpendService.execute(scope.tenantId, scope.storeId, id);
  }

  @Get('logs')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('marketing:read')
  @ApiOperation({ summary: 'Paginated marketing event log with filters' })
  async listLogs(
    @CurrentUser('sub') userId: string,
    @Query() query: ListMarketingLogsDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const scope = await this.resolveScope(userId, storeId);
    return this.listMarketingLogsService.execute(scope.tenantId, scope.storeId, query);
  }

  @Get('attribution/source-sales')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('marketing:read')
  @ApiOperation({
    summary:
      'Sales-by-Source report: sessions, orders, revenue, conversion rate, ad spend, ROAS and CPA per channel / UTM source / UTM campaign',
  })
  async getSourceSales(
    @CurrentUser('sub') userId: string,
    @Query() query: SourceSalesQueryDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const scope = await this.resolveScope(userId, storeId);
    const { from, to } = this.resolveWindow(query);
    return this.getSourceSalesReportService.execute(
      scope.tenantId,
      scope.storeId,
      from,
      to,
      query.groupBy ?? 'channel',
    );
  }
}
