import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GetMarketingDashboardService } from './services/get-marketing-dashboard.service';
import { GetMarketingLogsService } from './services/get-marketing-logs.service';
import { ConnectPixelService } from './services/connect-pixel.service';
import { DisconnectPixelService } from './services/disconnect-pixel.service';
import { ToggleTrackingEventService } from './services/toggle-tracking-event.service';
import { DispatchTestEventService } from './services/dispatch-test-event.service';
import { SeedMarketingDemoDataService } from './services/seed-marketing-demo-data.service';
import { ConnectPixelDto } from './dto/connect-pixel.dto';
import { ToggleEventDto } from './dto/toggle-event.dto';
import { DispatchTestEventDto } from './dto/dispatch-test-event.dto';
import { MarketingProviderEnum } from './entities/marketing-pixel.entity';
import { MarketingEventNameEnum } from './entities/marketing-event-config.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Marketing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('marketing')
export class MarketingController {
  constructor(
    private readonly getDashboardService: GetMarketingDashboardService,
    private readonly getLogsService: GetMarketingLogsService,
    private readonly connectPixelService: ConnectPixelService,
    private readonly disconnectPixelService: DisconnectPixelService,
    private readonly toggleEventService: ToggleTrackingEventService,
    private readonly testEventService: DispatchTestEventService,
    private readonly seedMarketingDemoDataService: SeedMarketingDemoDataService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Marketing Dashboard KPIs, Integrations, and Events' })
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
    return this.getLogsService.execute(tenantId, storeId, limit ? Number(limit) : 10, offset ? Number(offset) : 0);
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

  @Patch('events/:eventName')
  @ApiOperation({ summary: 'Toggle tracking event on/off' })
  async toggleEvent(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-store-id') storeId: string,
    @Param('eventName') eventName: MarketingEventNameEnum,
    @Body() dto: ToggleEventDto,
  ) {
    return this.toggleEventService.execute(tenantId, storeId, eventName, dto.isActive);
  }

  @Post('events/test')
  @ApiOperation({ summary: 'Dispatch a simulated test event' })
  async testEvent(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-store-id') storeId: string,
    @Body() dto: DispatchTestEventDto,
  ) {
    return this.testEventService.execute(tenantId, storeId, dto);
  }

  @Post('events/test-all')
  @ApiOperation({ summary: 'Test all connected pixels with PageView event' })
  async testAll(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-store-id') storeId: string,
  ) {
    return this.testEventService.testAll(tenantId, storeId);
  }

  @Post('seed-demo')
  @ApiOperation({ summary: 'Seed demo pixels, event configs and event logs (dev only)' })
  async seedDemo(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    return this.seedMarketingDemoDataService.execute(userId, storeId);
  }
}
