import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateReturnService } from '../services/create-return.service';
import { UpdateReturnStatusService } from '../services/update-return-status.service';
import { FindReturnsByOrderService } from '../services/find-returns-by-order.service';
import { CreateReturnDto } from '../dto/create-return.dto';
import { UpdateReturnStatusDto } from '../dto/update-return-status.dto';

@Controller('orders/:orderId/returns')
@UseGuards(JwtAuthGuard)
export class ReturnController {
  constructor(
    private readonly createReturnService: CreateReturnService,
    private readonly updateReturnStatusService: UpdateReturnStatusService,
    private readonly findReturnsByOrderService: FindReturnsByOrderService,
  ) {}

  @Post()
  async create(
    @Param('orderId') orderId: string,
    @Body() dto: Omit<CreateReturnDto, 'orderId'>,
    @Request() req: any,
  ) {
    const fullDto: CreateReturnDto = { ...dto, orderId };
    return this.createReturnService.execute(fullDto, req.user.tenantId);
  }

  @Get()
  async findAll(@Param('orderId') orderId: string, @Request() req: any) {
    return this.findReturnsByOrderService.execute(orderId, req.user.tenantId);
  }

  @Post(':returnId/status')
  async updateStatus(
    @Param('returnId') returnId: string,
    @Body() dto: UpdateReturnStatusDto,
    @Request() req: any,
  ) {
    const actor = req.user.email || req.user.id;
    return this.updateReturnStatusService.execute(returnId, dto, req.user.tenantId, actor);
  }
}
