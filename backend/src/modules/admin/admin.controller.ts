import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRoleEnum } from '../user/entities/user.entity';
import { GetPlatformStatsService } from './services/get-platform-stats.service';
import { GetPublicPlatformStatsService } from './services/get-public-platform-stats.service';
import { ListAllStoresService } from './services/list-all-stores.service';
import { ToggleStoreStatusService } from './services/toggle-store-status.service';
import { ListAllSystemOrdersService } from './services/list-all-system-orders.service';
import { PlatformConfigService } from './services/platform-config.service';
import { UpdatePlatformConfigDto } from './dto/update-platform-config.dto';
import { CreateContactMessageService } from './services/create-contact-message.service';
import { ListContactMessagesService } from './services/list-contact-messages.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { Body, Put } from '@nestjs/common';

@ApiTags('Super Admin Control Panel')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly getPlatformStatsService: GetPlatformStatsService,
    private readonly getPublicPlatformStatsService: GetPublicPlatformStatsService,
    private readonly listAllStoresService: ListAllStoresService,
    private readonly toggleStoreStatusService: ToggleStoreStatusService,
    private readonly listAllSystemOrdersService: ListAllSystemOrdersService,
    private readonly platformConfigService: PlatformConfigService,
    private readonly createContactMessageService: CreateContactMessageService,
    private readonly listContactMessagesService: ListContactMessagesService,
  ) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get platform-wide revenue & system metrics for Super Admin' })
  @ApiResponse({ status: 200, description: 'Platform statistics overview' })
  async getStats() {
    return this.getPlatformStatsService.execute();
  }

  /**
   * Public on purpose — the marketing site renders these totals for anonymous
   * visitors. Only coarse aggregates are returned; no per-merchant detail.
   */
  @Get('public-stats')
  @ApiOperation({ summary: 'Get aggregated public platform figures for the landing page' })
  @ApiResponse({ status: 200, description: 'Public platform statistics' })
  async getPublicStats() {
    return this.getPublicPlatformStatsService.execute();
  }

  @Get('stores')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all onboarded merchant stores across all tenants' })
  @ApiResponse({ status: 200, description: 'List of all stores' })
  async listStores() {
    return this.listAllStoresService.execute();
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all customer orders across all stores' })
  @ApiResponse({ status: 200, description: 'List of all system orders' })
  async listOrders() {
    return this.listAllSystemOrdersService.execute();
  }

  @Patch('stores/:id/toggle-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle store active or suspended status' })
  @ApiResponse({ status: 200, description: 'Store status updated' })
  async toggleStoreStatus(@Param('id') storeId: string) {
    return this.toggleStoreStatusService.execute(storeId);
  }

  @Get('platform-config')
  @ApiOperation({ summary: 'Get global CMS settings for the landing page (Public)' })
  @ApiResponse({ status: 200, description: 'Platform CMS data' })
  async getPlatformConfig() {
    return this.platformConfigService.getConfig();
  }

  @Put('platform-config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update global CMS settings (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'Platform CMS data updated' })
  async updatePlatformConfig(@Body() dto: UpdatePlatformConfigDto) {
    return this.platformConfigService.updateConfig(dto);
  }

  @Post('contact-messages')
  @ApiOperation({ summary: 'Submit a public "Contact Us" message (Public)' })
  @ApiResponse({ status: 201, description: 'Message received' })
  async submitContactMessage(@Body() dto: CreateContactMessageDto) {
    return this.createContactMessageService.execute(dto);
  }

  @Get('contact-messages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all "Contact Us" messages (Super Admin Only)' })
  @ApiResponse({ status: 200, description: 'List of contact messages' })
  async listContactMessages() {
    return this.listContactMessagesService.execute();
  }
}
