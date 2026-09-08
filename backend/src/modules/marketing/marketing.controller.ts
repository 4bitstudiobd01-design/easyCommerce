import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GetMarketingDashboardService } from './services/get-marketing-dashboard.service';
import { ConnectPixelService } from './services/connect-pixel.service';
import { DisconnectPixelService } from './services/disconnect-pixel.service';
import { ConnectPixelDto } from './dto/connect-pixel.dto';
import { MarketingProviderEnum } from './entities/marketing-pixel.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Marketing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('marketing')
export class MarketingController {
  constructor(
    private readonly getDashboardService: GetMarketingDashboardService,
    private readonly connectPixelService: ConnectPixelService,
    private readonly disconnectPixelService: DisconnectPixelService,
  ) {}

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
}
