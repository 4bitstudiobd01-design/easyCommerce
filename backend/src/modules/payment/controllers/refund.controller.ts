import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateRefundService } from '../services/create-refund.service';
import { ProcessRefundService } from '../services/process-refund.service';
import { FindRefundsByOrderService } from '../services/find-refunds-by-order.service';
import { CreateRefundDto } from '../dto/create-refund.dto';

@Controller('orders/:orderId/refunds')
@UseGuards(JwtAuthGuard)
export class RefundController {
  constructor(
    private readonly createRefundService: CreateRefundService,
    private readonly processRefundService: ProcessRefundService,
    private readonly findRefundsByOrderService: FindRefundsByOrderService,
  ) {}

  @Post()
  async create(
    @Param('orderId') orderId: string,
    @Body() dto: Omit<CreateRefundDto, 'orderId'>,
    @Request() req: any,
  ) {
    const fullDto: CreateRefundDto = { ...dto, orderId };
    return this.createRefundService.execute(fullDto, req.user.tenantId);
  }

  @Get()
  async findAll(@Param('orderId') orderId: string, @Request() req: any) {
    return this.findRefundsByOrderService.execute(orderId, req.user.tenantId);
  }

  @Post(':refundId/process')
  async process(
    @Param('refundId') refundId: string,
    @Request() req: any,
  ) {
    const actor = req.user.email || req.user.id;
    return this.processRefundService.execute(refundId, req.user.tenantId, actor);
  }
}
