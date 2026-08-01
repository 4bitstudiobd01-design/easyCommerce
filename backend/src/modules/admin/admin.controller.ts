import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetPlatformStatsService } from './services/get-platform-stats.service';
import { ListAllStoresService } from './services/list-all-stores.service';
import { ToggleStoreStatusService } from './services/toggle-store-status.service';
import { ListAllSystemOrdersService } from './services/list-all-system-orders.service';

@ApiTags('Super Admin Control Panel')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly getPlatformStatsService: GetPlatformStatsService,
    private readonly listAllStoresService: ListAllStoresService,
    private readonly toggleStoreStatusService: ToggleStoreStatusService,
    private readonly listAllSystemOrdersService: ListAllSystemOrdersService,
  ) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get platform-wide revenue & system metrics for Super Admin' })
  @ApiResponse({ status: 200, description: 'Platform statistics overview' })
  async getStats() {
    return this.getPlatformStatsService.execute();
  }

  @Get('stores')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all onboarded merchant stores across all tenants' })
  @ApiResponse({ status: 200, description: 'List of all stores' })
  async listStores() {
    return this.listAllStoresService.execute();
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all customer orders across all stores' })
  @ApiResponse({ status: 200, description: 'List of all system orders' })
  async listOrders() {
    return this.listAllSystemOrdersService.execute();
  }

  @Patch('stores/:id/toggle-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle store active or suspended status' })
  @ApiResponse({ status: 200, description: 'Store status updated' })
  async toggleStoreStatus(@Param('id') storeId: string) {
    return this.toggleStoreStatusService.execute(storeId);
  }
}
