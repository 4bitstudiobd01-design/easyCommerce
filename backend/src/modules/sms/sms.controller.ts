import { Controller, Get, Param, Patch, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ListSmsLogsService } from './services/list-sms-logs.service';
import { ListPushNotificationsService } from './services/list-push-notifications.service';
import { MarkPushNotificationsReadService } from './services/mark-push-notifications-read.service';
import { MarkPushNotificationReadService } from './services/mark-push-notification-read.service';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';

@ApiTags('SMS & Push Notifications')
@Controller('sms')
export class SmsController {
  constructor(
    private readonly listSmsLogsService: ListSmsLogsService,
    private readonly listPushNotificationsService: ListPushNotificationsService,
    private readonly markPushNotificationsReadService: MarkPushNotificationsReadService,
    private readonly markPushNotificationReadService: MarkPushNotificationReadService,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List sent SMS logs for merchant store' })
  @ApiResponse({ status: 200, description: 'List of SMS logs' })
  async getSmsLogs(@CurrentUser('sub') userId: string) {
    const store = await this.findStoreByUserService.execute(userId);
    if (!store) {
      throw new BadRequestException('Merchant store not found.');
    }
    return this.listSmsLogsService.execute(store.tenantId);
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List real-time push notifications for dashboard bell' })
  @ApiResponse({ status: 200, description: 'List of push notifications' })
  async getPushNotifications(@CurrentUser('sub') userId: string) {
    const store = await this.findStoreByUserService.execute(userId);
    if (!store) {
      throw new BadRequestException('Merchant store not found.');
    }
    return this.listPushNotificationsService.execute(store.tenantId);
  }

  @Patch('notifications/read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all push notifications as read' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read' })
  async markNotificationsRead(@CurrentUser('sub') userId: string) {
    const store = await this.findStoreByUserService.execute(userId);
    if (!store) {
      throw new BadRequestException('Merchant store not found.');
    }
    await this.markPushNotificationsReadService.execute(store.tenantId);
    return { success: true };
  }

  @Patch('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a single push notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markNotificationRead(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    const store = await this.findStoreByUserService.execute(userId);
    if (!store) {
      throw new BadRequestException('Merchant store not found.');
    }
    await this.markPushNotificationReadService.execute(store.tenantId, id);
    return { success: true };
  }
}
