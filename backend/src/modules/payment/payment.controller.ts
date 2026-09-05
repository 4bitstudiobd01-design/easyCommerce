import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { OrderEntity } from '../order/entities/order.entity';
import { NotificationDispatcherService } from '../sms/services/notification-dispatcher.service';
import { InitiateSslCommerzPaymentService } from './services/initiate-sslcommerz-payment.service';
import { ValidateSslCommerzPaymentService } from './services/validate-sslcommerz-payment.service';
import { ListMerchantPaymentsService } from './services/list-merchant-payments.service';
import { ListPaymentTransactionsService } from './services/list-payment-transactions.service';
import { GetPaymentSummaryService } from './services/get-payment-summary.service';
import { GetPaymentDetailsService } from './services/get-payment-details.service';
import { ListPaymentGatewaysService } from './services/list-payment-gateways.service';
import { ExportPaymentTransactionsService } from './services/export-payment-transactions.service';
import { SeedPaymentDemoDataService } from './services/seed-payment-demo-data.service';
import { GetOrderBalanceService } from './services/get-order-balance.service';
import { GetOrderPaymentHistoryService } from './services/get-order-payment-history.service';
import { RecordManualPaymentService } from './services/record-manual-payment.service';
import { VoidManualPaymentService } from './services/void-manual-payment.service';
import { CreatePaymentLinkForOrderService } from './services/create-payment-link-for-order.service';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { ListPaymentTransactionsQueryDto } from './dto/list-payment-transactions-query.dto';
import { PaymentTransactionListResponseDto } from './dto/payment-transaction-list-response.dto';
import {
  PaymentSummaryResponseDto,
  PaymentGatewaySummaryDto,
} from './dto/payment-summary-response.dto';
import { PaymentDetailsResponseDto } from './dto/payment-details-response.dto';
import { SeedPaymentDemoDataResponseDto } from './dto/seed-payment-demo-data-response.dto';
import { RecordManualPaymentDto } from './dto/record-manual-payment.dto';
import { VoidPaymentDto } from './dto/void-payment.dto';
import { CreatePaymentLinkDto } from './dto/create-payment-link.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('Payments & Gateways')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly initiateSslCommerzPaymentService: InitiateSslCommerzPaymentService,
    private readonly validateSslCommerzPaymentService: ValidateSslCommerzPaymentService,
    private readonly listMerchantPaymentsService: ListMerchantPaymentsService,
    private readonly listPaymentTransactionsService: ListPaymentTransactionsService,
    private readonly getPaymentSummaryService: GetPaymentSummaryService,
    private readonly getPaymentDetailsService: GetPaymentDetailsService,
    private readonly listPaymentGatewaysService: ListPaymentGatewaysService,
    private readonly exportPaymentTransactionsService: ExportPaymentTransactionsService,
    private readonly seedPaymentDemoDataService: SeedPaymentDemoDataService,
    private readonly getOrderBalanceService: GetOrderBalanceService,
    private readonly getOrderPaymentHistoryService: GetOrderPaymentHistoryService,
    private readonly recordManualPaymentService: RecordManualPaymentService,
    private readonly voidManualPaymentService: VoidManualPaymentService,
    private readonly createPaymentLinkForOrderService: CreatePaymentLinkForOrderService,
    private readonly notificationDispatcherService: NotificationDispatcherService,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly findStoreByUserService: FindStoreByUserService,
    private readonly configService: ConfigService,
  ) {}

  private async getMerchantTenantId(userId: string, storeId?: string): Promise<string> {
    const store = await this.findStoreByUserService.execute(userId, storeId);
    if (!store) {
      throw new BadRequestException('Merchant must create a store before viewing payments.');
    }
    return store.tenantId;
  }

  // --- PUBLIC UNPROTECTED PAYMENTS & CALLBACKS ---

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate online SSLCommerz payment for an order' })
  @ApiResponse({ status: 201, description: 'SSLCommerz Gateway Page URL' })
  @ApiResponse({ status: 400, description: 'Order not found or invalid payment request' })
  async initiatePayment(@Body() dto: InitiatePaymentDto) {
    return this.initiateSslCommerzPaymentService.execute(dto.orderId);
  }

  @Post('sslcommerz/success')
  @Get('sslcommerz/success')
  @ApiOperation({ summary: 'SSLCommerz payment success callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend checkout success/fail page' })
  async sslCommerzSuccess(@Req() req: Request, @Res() res: Response) {
    const payload = { ...req.query, ...req.body };
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    const result = await this.validateSslCommerzPaymentService.execute({
      tran_id: payload.tran_id,
      val_id: payload.val_id,
      amount: payload.amount,
      card_type: payload.card_type,
      bank_tran_id: payload.bank_tran_id,
      status: payload.status,
    });

    const slug = result.storeSlug || '';
    const base = slug ? `${frontendUrl}/store/${encodeURIComponent(slug)}` : frontendUrl;

    if (result.success) {
      return res.redirect(
        `${base}/checkout/success?orderNumber=${encodeURIComponent(result.orderNumber || '')}&storeSlug=${encodeURIComponent(slug)}`,
      );
    }

    return res.redirect(`${base}/checkout?status=FAIL`);
  }

  @Post('sslcommerz/fail')
  @Get('sslcommerz/fail')
  @ApiOperation({ summary: 'SSLCommerz payment fail callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend checkout page with FAIL status' })
  async sslCommerzFail(@Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return res.redirect(`${frontendUrl}/checkout?status=FAIL`);
  }

  @Post('sslcommerz/cancel')
  @Get('sslcommerz/cancel')
  @ApiOperation({ summary: 'SSLCommerz payment cancel callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend checkout page with CANCEL status' })
  async sslCommerzCancel(@Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return res.redirect(`${frontendUrl}/checkout?status=CANCEL`);
  }

  @Post('sslcommerz/ipn')
  @ApiOperation({ summary: 'SSLCommerz IPN Webhook callback' })
  @ApiResponse({ status: 201, description: 'Payment validated and order updated via server-to-server IPN' })
  async sslCommerzIpn(@Req() req: Request) {
    const payload = { ...req.query, ...req.body };
    return this.validateSslCommerzPaymentService.execute({
      tran_id: payload.tran_id,
      val_id: payload.val_id,
      amount: payload.amount,
      card_type: payload.card_type,
      bank_tran_id: payload.bank_tran_id,
      status: payload.status,
    });
  }

  // --- PROTECTED MERCHANT DASHBOARD ROUTES ---

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all payment transactions for merchant store' })
  @ApiResponse({ status: 200, description: 'List of store payment records' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 400, description: 'Merchant has not created a store yet' })
  async listMerchantPayments(@CurrentUser('sub') userId: string) {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.listMerchantPaymentsService.execute(tenantId);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({
    summary: 'Paginated, filterable and searchable payment transaction list',
  })
  @ApiResponse({ status: 200, description: 'Paginated transactions', type: PaymentTransactionListResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 403, description: 'Caller lacks the required permission' })
  @ApiResponse({ status: 400, description: 'Merchant has not created a store yet' })
  async listPaymentTransactions(
    @CurrentUser('sub') userId: string,
    @Query() query: ListPaymentTransactionsQueryDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<PaymentTransactionListResponseDto> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.listPaymentTransactionsService.execute(tenantId, query);
  }

  @Get('transactions/summary')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({
    summary: 'Aggregated payment KPIs, overview chart data, top methods and gateways',
  })
  @ApiResponse({ status: 200, description: 'Payment summary', type: PaymentSummaryResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 403, description: 'Caller lacks the required permission' })
  async getPaymentSummary(
    @CurrentUser('sub') userId: string,
    @Query() query: ListPaymentTransactionsQueryDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<PaymentSummaryResponseDto> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.getPaymentSummaryService.execute(tenantId, query);
  }

  @Get('transactions/export')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:manage')
  @ApiOperation({ summary: 'Export the currently filtered transaction set as CSV' })
  @ApiResponse({ status: 200, description: 'CSV export stream' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 403, description: 'Caller lacks the required permission' })
  async exportPaymentTransactions(
    @CurrentUser('sub') userId: string,
    @Query() query: ListPaymentTransactionsQueryDto,
    @Res() res: Response,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    const result = await this.exportPaymentTransactionsService.execute(tenantId, query);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('X-Export-Row-Count', String(result.rowCount));
    res.setHeader('X-Export-Truncated', String(result.truncated));
    return res.send(result.content);
  }

  @Get('gateways')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'List the merchant’s payment gateways (never returns credentials)' })
  @ApiResponse({ status: 200, description: 'Connected gateways', type: [PaymentGatewaySummaryDto] })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  async listPaymentGateways(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<PaymentGatewaySummaryDto[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.listPaymentGatewaysService.execute(tenantId);
  }

  @Post('transactions/seed-demo-data')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:manage')
  @ApiOperation({ summary: 'Seed realistic payment demo transactions, refunds and events' })
  @ApiResponse({ status: 200, description: 'Demo data seeded', type: SeedPaymentDemoDataResponseDto })
  @ApiResponse({ status: 403, description: 'Demo seeder disabled in production environment' })
  async seedPaymentDemoData(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<SeedPaymentDemoDataResponseDto> {
    const store = await this.findStoreByUserService.execute(userId, storeId);
    if (!store) {
      throw new BadRequestException('Merchant must create a store before seeding payments.');
    }
    return this.seedPaymentDemoDataService.execute(store.tenantId, store.slug);
  }

  @Get('transactions/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'Full payment details including refunds and lifecycle timeline' })
  @ApiResponse({ status: 200, description: 'Payment details', type: PaymentDetailsResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 404, description: 'Payment not found or access denied' })
  async getPaymentDetails(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<PaymentDetailsResponseDto> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.getPaymentDetailsService.execute(tenantId, id);
  }

  @Get('orders/:orderId/balance')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'Amount paid and balance due for one order' })
  @ApiResponse({ status: 200, description: 'Order balance' })
  async getOrderBalance(
    @CurrentUser('sub') userId: string,
    @Param('orderId') orderId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.getOrderBalanceService.execute(tenantId, orderId);
  }

  @Get('orders/:orderId/history')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'All payment records for one order, most recent first' })
  @ApiResponse({ status: 200, description: 'Payment history' })
  async getOrderPaymentHistory(
    @CurrentUser('sub') userId: string,
    @Param('orderId') orderId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.getOrderPaymentHistoryService.execute(tenantId, orderId);
  }

  @Post('orders/:orderId/manual-payment')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:manage')
  @ApiOperation({ summary: 'Record a payment received offline (cash, bKash-in-hand, etc.)' })
  @ApiResponse({ status: 201, description: 'Manual payment recorded' })
  @ApiResponse({ status: 400, description: 'Amount exceeds the current balance due' })
  async recordManualPayment(
    @CurrentUser('sub') userId: string,
    @Param('orderId') orderId: string,
    @Body() dto: RecordManualPaymentDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.recordManualPaymentService.execute(tenantId, orderId, dto);
  }

  @Post(':paymentId/void')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:manage')
  @ApiOperation({ summary: 'Void a recorded payment (COD collection, manual, or online) — reverses its effect on the order balance' })
  @ApiResponse({ status: 200, description: 'Payment voided, order paymentStatus recomputed' })
  @ApiResponse({ status: 400, description: 'Payment is not in a voidable state' })
  async voidPayment(
    @CurrentUser('sub') userId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: VoidPaymentDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.voidManualPaymentService.execute(paymentId, tenantId, userId, dto.reason);
  }

  @Post('orders/:orderId/payment-link')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:manage')
  @ApiOperation({ summary: 'Generate a shareable SSLCommerz payment link for an existing order, optionally SMS it to the customer' })
  @ApiResponse({ status: 201, description: 'Payment link generated' })
  @ApiResponse({ status: 400, description: 'No outstanding balance, or amount exceeds balance due' })
  async createPaymentLink(
    @CurrentUser('sub') userId: string,
    @Param('orderId') orderId: string,
    @Body() dto: CreatePaymentLinkDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    const link = await this.createPaymentLinkForOrderService.execute(tenantId, orderId, dto.amount);

    if (dto.sendSms) {
      const order = await this.orderRepository.findOne({ where: { id: orderId, tenantId } });
      if (order) {
        await this.notificationDispatcherService.dispatch({
          tenantId,
          recipientPhone: order.customerPhone,
          smsMessage: `Please complete your payment of ৳${link.amount} for order #${order.orderNumber}: ${link.gatewayUrl}`,
        });
      }
    }

    return link;
  }
}
