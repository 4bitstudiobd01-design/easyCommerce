import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateOrderService } from './services/create-order.service';
import { ListMerchantOrdersService } from './services/list-merchant-orders.service';
import { OrderKpiService } from './services/order-kpi.service';
import { FindOrderByIdService } from './services/find-order-by-id.service';
import { UpdateOrderStatusService } from './services/update-order-status.service';
import { TrackPublicOrderService } from './services/track-public-order.service';
import { GenerateOrderInvoiceService } from './services/generate-order-invoice.service';
import { GenerateThermalLabelService } from './services/generate-thermal-label.service';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';
import { CollectCodService } from './services/collect-cod.service';
import { UndoCollectCodService } from './services/undo-collect-cod.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { EditOrderDto } from './dto/edit-order.dto';
import { OrderListDto } from './dto/order-list.dto';
import { UndoCollectCodDto } from './dto/undo-collect-cod.dto';
import { EditOrderService } from './services/edit-order.service';

@ApiTags('Orders & Sales')
@Controller('orders')
export class OrderController {
  constructor(
    private readonly createOrderService: CreateOrderService,
    private readonly listMerchantOrdersService: ListMerchantOrdersService,
    private readonly orderKpiService: OrderKpiService,
    private readonly findOrderByIdService: FindOrderByIdService,
    private readonly updateOrderStatusService: UpdateOrderStatusService,
    private readonly trackPublicOrderService: TrackPublicOrderService,
    private readonly generateOrderInvoiceService: GenerateOrderInvoiceService,
    private readonly generateThermalLabelService: GenerateThermalLabelService,
    private readonly findStoreByUserService: FindStoreByUserService,
    private readonly editOrderService: EditOrderService,
    private readonly collectCodService: CollectCodService,
    private readonly undoCollectCodService: UndoCollectCodService,
  ) {}

  private async getMerchantTenantId(userId: string, storeId?: string): Promise<string> {
    const store = await this.findStoreByUserService.execute(userId, storeId);
    if (!store) {
      throw new BadRequestException('Merchant must create a store before managing orders.');
    }
    return store.tenantId;
  }

  // --- PUBLIC UNPROTECTED STOREFRONT & TRACKING ROUTES ---

  @Post('public/checkout')
  @ApiOperation({ summary: 'Public customer checkout and order creation' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  async publicCheckout(@Body() dto: CreateOrderDto) {
    return this.createOrderService.execute(dto);
  }

  @Get('public/track')
  @ApiOperation({ summary: 'Public order & courier parcel live tracking search' })
  @ApiResponse({ status: 200, description: 'Order tracking details' })
  async publicTrack(
    @Query('query') query: string,
    @Query('storeSlug') storeSlug?: string,
  ) {
    if (!query) {
      throw new BadRequestException('Please provide an order number or customer phone number.');
    }
    return this.trackPublicOrderService.execute(query, storeSlug);
  }

  // --- PROTECTED MERCHANT DASHBOARD ROUTES ---

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all sales orders for merchant store' })
  @ApiResponse({ status: 200, description: 'Paginated list of store orders' })
  async listMerchantOrders(
    @CurrentUser('sub') userId: string,
    @Query() dto: OrderListDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.listMerchantOrdersService.execute(tenantId, dto);
  }

  @Get('kpi')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get KPI metrics for orders' })
  @ApiResponse({ status: 200, description: 'Order KPI metrics' })
  async getOrderKpis(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.orderKpiService.execute(tenantId);
  }

  @Get(':id/invoice')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate printable cash memo customer invoice' })
  @ApiResponse({ status: 200, description: 'Order Cash Memo Invoice' })
  async getOrderInvoice(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.generateOrderInvoiceService.execute(id, userId);
  }

  @Get(':id/thermal-label')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate 4x6 thermal shipping sticker label' })
  @ApiResponse({ status: 200, description: 'Thermal Sticker Label' })
  async getThermalLabel(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.generateThermalLabelService.execute(id, userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order details by ID' })
  @ApiResponse({ status: 200, description: 'Order detail' })
  async getOrderById(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.findOrderByIdService.execute(id, tenantId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  async updateOrderStatus(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.updateOrderStatusService.execute(id, tenantId, userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit an existing order' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  async editOrder(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: EditOrderDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.editOrderService.execute(id, tenantId, userId, dto);
  }

  @Post(':id/payment/cod/collect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark COD payment as collected' })
  @ApiResponse({ status: 200, description: 'COD payment marked as collected' })
  async collectCodPayment(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.collectCodService.execute(id, tenantId, userId);
  }

  @Post(':id/payment/cod/undo-collect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Undo a mistaken COD collection' })
  @ApiResponse({ status: 200, description: 'COD payment reverted to pending' })
  async undoCollectCodPayment(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UndoCollectCodDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.undoCollectCodService.execute(id, tenantId, userId, dto.reason);
  }
}
