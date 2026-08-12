import { Controller, Post, Get, Body, Param, UseGuards, Req, HttpStatus } from '@nestjs/common';
import { OrderNoteService, CreateOrderNoteDto } from '../services/order-note.service';
import { OrderTimelineService } from '../services/order-timeline.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRoleEnum } from '../../user/entities/user.entity';

@Controller('orders/:orderId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderNoteController {
  constructor(
    private readonly orderNoteService: OrderNoteService,
    private readonly orderTimelineService: OrderTimelineService,
  ) {}

  @Post('notes')
  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  async createNote(
    @Param('orderId') orderId: string,
    @Req() req: any,
    @Body() dto: CreateOrderNoteDto,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;

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
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const notes = await this.orderNoteService.getNotesForOrder(orderId, tenantId);
    return {
      statusCode: HttpStatus.OK,
      data: notes,
    };
  }

  @Get('timeline')
  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  async getTimeline(
    @Param('orderId') orderId: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const timeline = await this.orderTimelineService.getTimeline(orderId, tenantId);
    return {
      statusCode: HttpStatus.OK,
      data: timeline,
    };
  }
}
