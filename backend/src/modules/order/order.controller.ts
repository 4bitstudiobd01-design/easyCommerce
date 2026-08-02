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
import { FindOrderByIdService } from './services/find-order-by-id.service';
import { UpdateOrderStatusService } from './services/update-order-status.service';
import { TrackPublicOrderService } from './services/track-public-order.service';
import { GenerateOrderInvoiceService } from './services/generate-order-invoice.service';
import { GenerateThermalLabelService } from './services/generate-thermal-label.service';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('Orders & Sales')
@Controller('orders')
export class OrderController {
  constructor(
    private readonly createOrderService: CreateOrderService,
    private readonly listMerchantOrdersService: ListMerchantOrdersService,
    private readonly findOrderByIdService: FindOrderByIdService,
    private readonly updateOrderStatusService: UpdateOrderStatusService,
    private readonly trackPublicOrderService: TrackPublicOrderService,
    private readonly generateOrderInvoiceService: GenerateOrderInvoiceService,
    private readonly generateThermalLabelService: GenerateThermalLabelService,
    private readonly findStoreByUserService: FindStoreByUserService,
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
  @ApiResponse({ status: 200, description: 'List of store orders' })
  async listMerchantOrders(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.listMerchantOrdersService.execute(tenantId);
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
    return this.updateOrderStatusService.execute(id, tenantId, dto);
  }
}
