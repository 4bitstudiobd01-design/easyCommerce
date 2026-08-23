import { Controller, Post, Get, Param, Body, Headers, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { FindStoreByUserService } from '../../tenant/services/find-store-by-user.service';
import { UserRoleEnum } from '../../user/entities/user.entity';
import { CreateReturnService } from '../services/create-return.service';
import { UpdateReturnStatusService } from '../services/update-return-status.service';
import { FindReturnsByOrderService } from '../services/find-returns-by-order.service';
import { CreateReturnDto } from '../dto/create-return.dto';
import { UpdateReturnStatusDto } from '../dto/update-return-status.dto';

@Controller('orders/:orderId/returns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReturnController {
  constructor(
    private readonly createReturnService: CreateReturnService,
    private readonly updateReturnStatusService: UpdateReturnStatusService,
    private readonly findReturnsByOrderService: FindReturnsByOrderService,
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
    @Body() dto: Omit<CreateReturnDto, 'orderId'>,
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId: string | undefined,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    const fullDto: CreateReturnDto = { ...dto, orderId };
    return this.createReturnService.execute(fullDto, tenantId);
  }

  @Get()
  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  async findAll(
    @Param('orderId') orderId: string,
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId: string | undefined,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.findReturnsByOrderService.execute(orderId, tenantId);
  }

  @Post(':returnId/status')
  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  async updateStatus(
    @Param('returnId') returnId: string,
    @Body() dto: UpdateReturnStatusDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('email') email: string,
    @Headers('x-store-id') storeId: string | undefined,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    const actor = email || userId;
    return this.updateReturnStatusService.execute(returnId, dto, tenantId, actor);
  }
}
