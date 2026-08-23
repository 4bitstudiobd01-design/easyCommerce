import { Controller, Post, Get, Param, Body, Headers, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { FindStoreByUserService } from '../../tenant/services/find-store-by-user.service';
import { UserRoleEnum } from '../../user/entities/user.entity';
import { CreateRefundService } from '../services/create-refund.service';
import { ProcessRefundService } from '../services/process-refund.service';
import { FindRefundsByOrderService } from '../services/find-refunds-by-order.service';
import { CreateRefundDto } from '../dto/create-refund.dto';

@Controller('orders/:orderId/refunds')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RefundController {
  constructor(
    private readonly createRefundService: CreateRefundService,
    private readonly processRefundService: ProcessRefundService,
    private readonly findRefundsByOrderService: FindRefundsByOrderService,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  private async getMerchantTenantId(userId: string, storeId?: string): Promise<string> {
    const store = await this.findStoreByUserService.execute(userId, storeId);
    if (!store) {
      throw new BadRequestException('Merchant must create a store before managing orders.');
    }
    return store.tenantId;
  }

  @Post()
  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  async create(
    @Param('orderId') orderId: string,
    @Body() dto: Omit<CreateRefundDto, 'orderId'>,
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId: string | undefined,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    const fullDto: CreateRefundDto = { ...dto, orderId };
    return this.createRefundService.execute(fullDto, tenantId);
  }

  @Get()
  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  async findAll(
    @Param('orderId') orderId: string,
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId: string | undefined,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.findRefundsByOrderService.execute(orderId, tenantId);
  }

  @Post(':refundId/process')
  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  async process(
    @Param('refundId') refundId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('email') email: string,
    @Headers('x-store-id') storeId: string | undefined,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    const actor = email || userId;
    return this.processRefundService.execute(refundId, tenantId, actor);
  }
}
