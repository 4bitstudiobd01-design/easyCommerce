import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';
import { StoreEntity } from '../tenant/entities/store.entity';

import { CreateSupplierService } from './services/create-supplier.service';
import { UpdateSupplierService } from './services/update-supplier.service';
import { DeleteSupplierService } from './services/delete-supplier.service';
import { ListSuppliersService } from './services/list-suppliers.service';
import { GetSupplierStatsService } from './services/get-supplier-stats.service';
import { CreatePurchaseOrderService } from './services/create-purchase-order.service';
import { UpdatePurchaseOrderService } from './services/update-purchase-order.service';
import { CancelPurchaseOrderService } from './services/cancel-purchase-order.service';
import { ReceivePurchaseOrderService } from './services/receive-purchase-order.service';
import { ListPurchaseOrdersService } from './services/list-purchase-orders.service';
import { GetPurchaseOrderService } from './services/get-purchase-order.service';
import { GetPurchaseOrderStatsService } from './services/get-purchase-order-stats.service';
import { CreateBillService } from './services/create-bill.service';
import { UpdateBillService } from './services/update-bill.service';
import { DeleteBillService } from './services/delete-bill.service';
import { ListBillsService } from './services/list-bills.service';
import { GetBillService } from './services/get-bill.service';
import { GetBillStatsService } from './services/get-bill-stats.service';
import { RecordSupplierPaymentService } from './services/record-supplier-payment.service';
import { ListSupplierPaymentsService } from './services/list-supplier-payments.service';
import { GetPurchaseOverviewService } from './services/get-purchase-overview.service';

import {
  CreateSupplierDto,
  UpdateSupplierDto,
  ListSuppliersQueryDto,
} from './dto/supplier.dto';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  ListPurchaseOrdersQueryDto,
} from './dto/purchase-order.dto';
import { CreateBillDto, UpdateBillDto, ListBillsQueryDto } from './dto/bill.dto';
import {
  RecordSupplierPaymentDto,
  ListSupplierPaymentsQueryDto,
} from './dto/supplier-payment.dto';
import { PurchaseOverviewQueryDto } from './dto/overview.dto';

/**
 * Merchant-facing purchase API. Mounted at /api/v1/purchase.
 *
 * Every handler resolves the active store through `getStoreContext`, then passes
 * `store.tenantId` / `store.id` to the services. Per-page slices (suppliers, purchase
 * orders, bills, supplier payments, overview) add their handlers here.
 */
@ApiTags('Purchase')
@Controller('purchase')
export class PurchaseController {
  constructor(
    private readonly findStoreByUserService: FindStoreByUserService,
    private readonly createSupplierService: CreateSupplierService,
    private readonly updateSupplierService: UpdateSupplierService,
    private readonly deleteSupplierService: DeleteSupplierService,
    private readonly listSuppliersService: ListSuppliersService,
    private readonly getSupplierStatsService: GetSupplierStatsService,
    private readonly createPurchaseOrderService: CreatePurchaseOrderService,
    private readonly updatePurchaseOrderService: UpdatePurchaseOrderService,
    private readonly cancelPurchaseOrderService: CancelPurchaseOrderService,
    private readonly receivePurchaseOrderService: ReceivePurchaseOrderService,
    private readonly listPurchaseOrdersService: ListPurchaseOrdersService,
    private readonly getPurchaseOrderService: GetPurchaseOrderService,
    private readonly getPurchaseOrderStatsService: GetPurchaseOrderStatsService,
    private readonly createBillService: CreateBillService,
    private readonly updateBillService: UpdateBillService,
    private readonly deleteBillService: DeleteBillService,
    private readonly listBillsService: ListBillsService,
    private readonly getBillService: GetBillService,
    private readonly getBillStatsService: GetBillStatsService,
    private readonly recordSupplierPaymentService: RecordSupplierPaymentService,
    private readonly listSupplierPaymentsService: ListSupplierPaymentsService,
    private readonly getPurchaseOverviewService: GetPurchaseOverviewService,
  ) {}

  private async getStoreContext(
    userId: string,
    storeIdHeader?: string,
  ): Promise<StoreEntity> {
    const store = await this.findStoreByUserService.execute(userId, storeIdHeader);
    if (!store) {
      throw new BadRequestException('Merchant store context not found.');
    }
    return store;
  }

  // ─── Overview ──────────────────────────────────────────────────

  @Get('overview')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:read', 'purchases:manage')
  @ApiOperation({ summary: 'Aggregate KPIs, trend and lists for the Purchase overview page' })
  @ApiResponse({ status: 200, description: 'Purchase overview payload' })
  async getOverview(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: PurchaseOverviewQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getPurchaseOverviewService.execute(store.id, query);
  }

  // ─── Suppliers ─────────────────────────────────────────────────

  @Get('suppliers')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:read', 'purchases:manage')
  @ApiOperation({ summary: 'List suppliers for the active store' })
  @ApiResponse({ status: 200, description: 'Paginated suppliers with computed totals' })
  async listSuppliers(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListSuppliersQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listSuppliersService.execute(store.id, query);
  }

  @Get('suppliers/stats')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:read', 'purchases:manage')
  @ApiOperation({ summary: 'Supplier KPI figures for the active store' })
  @ApiResponse({ status: 200, description: 'Supplier stats' })
  async getSupplierStats(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getSupplierStatsService.execute(store.id);
  }

  @Post('suppliers')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:manage')
  @ApiOperation({ summary: 'Add a supplier' })
  @ApiResponse({ status: 201, description: 'The created supplier' })
  async createSupplier(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateSupplierDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createSupplierService.execute(store.tenantId, store.id, dto, userId);
  }

  @Patch('suppliers/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:manage')
  @ApiOperation({ summary: 'Edit a supplier' })
  @ApiResponse({ status: 200, description: 'The updated supplier' })
  async updateSupplier(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateSupplierService.execute(store.id, id, dto);
  }

  @Delete('suppliers/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:manage')
  @ApiOperation({ summary: 'Delete a supplier (blocked if it has purchase history)' })
  @ApiResponse({ status: 200, description: 'Deletion result' })
  async deleteSupplier(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.deleteSupplierService.execute(store.id, id);
  }

  // ─── Purchase orders ───────────────────────────────────────────

  @Get('purchase-orders')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:read', 'purchases:manage')
  @ApiOperation({ summary: 'List purchase orders for the active store' })
  @ApiResponse({ status: 200, description: 'Paginated purchase orders' })
  async listPurchaseOrders(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListPurchaseOrdersQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listPurchaseOrdersService.execute(store.id, query);
  }

  @Get('purchase-orders/stats')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:read', 'purchases:manage')
  @ApiOperation({ summary: 'Per-status purchase-order KPI figures' })
  @ApiResponse({ status: 200, description: 'Purchase order stats' })
  async getPurchaseOrderStats(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getPurchaseOrderStatsService.execute(store.id);
  }

  @Post('purchase-orders')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:manage')
  @ApiOperation({ summary: 'Raise a purchase order with line items' })
  @ApiResponse({ status: 201, description: 'The created purchase order with its lines' })
  async createPurchaseOrder(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createPurchaseOrderService.execute(store.tenantId, store.id, dto, userId);
  }

  @Get('purchase-orders/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:read', 'purchases:manage')
  @ApiOperation({ summary: 'Get a purchase order with its lines' })
  @ApiResponse({ status: 200, description: 'The purchase order' })
  async getPurchaseOrder(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getPurchaseOrderService.execute(store.id, id);
  }

  @Patch('purchase-orders/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:manage')
  @ApiOperation({ summary: 'Edit a draft / sent purchase order' })
  @ApiResponse({ status: 200, description: 'The updated purchase order' })
  async updatePurchaseOrder(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updatePurchaseOrderService.execute(store.tenantId, store.id, id, dto);
  }

  @Post('purchase-orders/:id/cancel')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:manage')
  @ApiOperation({ summary: 'Cancel a purchase order' })
  @ApiResponse({ status: 201, description: 'The cancelled purchase order' })
  async cancelPurchaseOrder(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.cancelPurchaseOrderService.execute(store.id, id);
  }

  @Post('purchase-orders/:id/receive')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:manage')
  @ApiOperation({ summary: 'Receive goods against a purchase order (pushes stock in)' })
  @ApiResponse({ status: 201, description: 'The updated purchase order with its lines' })
  async receivePurchaseOrder(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.receivePurchaseOrderService.execute(
      store.tenantId,
      store.id,
      id,
      dto,
      userId,
    );
  }

  // ─── Bills (Purchases) ─────────────────────────────────────────

  @Get('bills')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:read', 'purchases:manage')
  @ApiOperation({ summary: 'List bills / purchases for the active store' })
  @ApiResponse({ status: 200, description: 'Paginated bills with computed due amounts' })
  async listBills(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListBillsQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listBillsService.execute(store.id, query);
  }

  @Get('bills/stats')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:read', 'purchases:manage')
  @ApiOperation({ summary: 'Bill KPI figures with month-over-month deltas' })
  @ApiResponse({ status: 200, description: 'Bill stats' })
  async getBillStats(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getBillStatsService.execute(store.id);
  }

  @Post('bills')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:manage')
  @ApiOperation({ summary: 'Record a supplier bill (auto-posts an Accounts Payable entry)' })
  @ApiResponse({ status: 201, description: 'The created bill with its lines' })
  async createBill(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateBillDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createBillService.execute(store.tenantId, store.id, dto, userId);
  }

  @Get('bills/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:read', 'purchases:manage')
  @ApiOperation({ summary: 'Get a bill with its lines' })
  @ApiResponse({ status: 200, description: 'The bill' })
  async getBill(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getBillService.execute(store.id, id);
  }

  @Patch('bills/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:manage')
  @ApiOperation({ summary: 'Edit bill metadata (invoice no / due date / notes)' })
  @ApiResponse({ status: 200, description: 'The updated bill' })
  async updateBill(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBillDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateBillService.execute(store.id, id, dto);
  }

  @Delete('bills/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:manage')
  @ApiOperation({ summary: 'Delete a bill (blocked once posted or paid)' })
  @ApiResponse({ status: 200, description: 'Deletion result' })
  async deleteBill(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.deleteBillService.execute(store.id, id);
  }

  // ─── Supplier payments ─────────────────────────────────────────

  @Get('supplier-payments')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:read', 'purchases:manage')
  @ApiOperation({ summary: 'List supplier payments (filter by bill or supplier)' })
  @ApiResponse({ status: 200, description: 'Paginated supplier payments' })
  async listSupplierPayments(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListSupplierPaymentsQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listSupplierPaymentsService.execute(store.id, query);
  }

  @Post('supplier-payments')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('purchases:manage')
  @ApiOperation({ summary: 'Record a payment to a supplier (auto-posts DEBIT AP / CREDIT Cash)' })
  @ApiResponse({ status: 201, description: 'The created supplier payment' })
  async recordSupplierPayment(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: RecordSupplierPaymentDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.recordSupplierPaymentService.execute(store.tenantId, store.id, dto, userId);
  }
}
