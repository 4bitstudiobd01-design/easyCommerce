import { Controller, Post, Body, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { BulkUpdateOrderStatusService, BulkUpdateStatusDto } from '../services/bulk-update-order-status.service';
import { ExportOrdersService, ExportOrdersDto } from '../services/export-orders.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRoleEnum } from '../../user/entities/user.entity';

@Controller('orders/bulk')
@UseGuards(JwtAuthGuard)
export class BulkOrderController {
  constructor(
    private readonly bulkUpdateStatusService: BulkUpdateOrderStatusService,
    private readonly exportOrdersService: ExportOrdersService,
  ) {}

  @Post('status')
  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  async updateBulkStatus(
    @Req() req: any,
    @Body() dto: BulkUpdateStatusDto,
  ) {
    const tenantId = req.user.tenantId;
    const storeId = req.headers['x-store-id'] as string;
    const userId = req.user.id;

    if (!storeId) {
      return { statusCode: HttpStatus.BAD_REQUEST, message: 'Store ID is required in headers.' };
    }

    const result = await this.bulkUpdateStatusService.execute(tenantId, storeId, dto, userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Bulk operation completed',
      data: result,
    };
  }

  @Post('export')
  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  async exportOrders(
    @Req() req: any,
    @Res() res: Response,
    @Body() dto: ExportOrdersDto,
  ) {
    const tenantId = req.user.tenantId;
    const storeId = req.headers['x-store-id'] as string;

    if (!storeId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Store ID is required' });
    }

    const stream = await this.exportOrdersService.execute(tenantId, storeId, dto);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="orders-export-${new Date().getTime()}.csv"`);
    
    stream.pipe(res);
  }
}
