import { Controller, Post, Get, Body, Param, Query, Headers, UseGuards, BadRequestException, HttpStatus } from '@nestjs/common';
import { OrderNoteService, CreateOrderNoteDto } from '../services/order-note.service';
import { OrderTimelineService } from '../services/order-timeline.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { FindStoreByUserService } from '../../tenant/services/find-store-by-user.service';
import { UserRoleEnum } from '../../user/entities/user.entity';

@Controller('orders/:orderId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderNoteController {
  constructor(
    private readonly orderNoteService: OrderNoteService,
    private readonly orderTimelineService: OrderTimelineService,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  private async getMerchantTenantId(userId: string, storeId?: string): Promise<string> {
    const store = await this.findStoreByUserService.execute(userId, storeId);
    if (!store) {
      throw new BadRequestException('Merchant must create a store before managing orders.');
    }
    return store.tenantId;
  }

  @Post('notes')
  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  async createNote(
    @Param('orderId') orderId: string,
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId: string | undefined,
    @Body() dto: CreateOrderNoteDto,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);

    const note = await this.orderNoteService.createNote(orderId, tenantId, dto, userId);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Note added successfully',
      data: note,
    };
  }

  @Get('notes')
  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  async getNotes(
    @Param('orderId') orderId: string,
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId: string | undefined,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    const notes = await this.orderNoteService.getNotesForOrder(orderId, tenantId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Notes retrieved successfully',
      data: notes,
    };
  }

  @Get('timeline')
  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  async getTimeline(
    @Param('orderId') orderId: string,
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId: string | undefined,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    const timeline = await this.orderTimelineService.getTimeline(
      orderId,
      tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Timeline retrieved successfully',
      data: timeline,
    };
  }
}
