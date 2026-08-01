import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InitiateSslCommerzPaymentService } from './services/initiate-sslcommerz-payment.service';
import { ValidateSslCommerzPaymentService } from './services/validate-sslcommerz-payment.service';
import { ListMerchantPaymentsService } from './services/list-merchant-payments.service';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { SslCommerzCallbackDto } from './dto/sslcommerz-callback.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('Payments & Gateways')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly initiateSslCommerzPaymentService: InitiateSslCommerzPaymentService,
    private readonly validateSslCommerzPaymentService: ValidateSslCommerzPaymentService,
    private readonly listMerchantPaymentsService: ListMerchantPaymentsService,
    private readonly findStoreByUserService: FindStoreByUserService,
    private readonly configService: ConfigService,
  ) {}

  private async getMerchantTenantId(userId: string): Promise<string> {
    const store = await this.findStoreByUserService.execute(userId);
    if (!store) {
      throw new BadRequestException('Merchant must create a store before viewing payments.');
    }
    return store.tenantId;
  }

  // --- PUBLIC UNPROTECTED PAYMENTS & CALLBACKS ---

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate online SSLCommerz payment for an order' })
  @ApiResponse({ status: 201, description: 'SSLCommerz Gateway Page URL' })
  async initiatePayment(@Body() dto: InitiatePaymentDto) {
    return this.initiateSslCommerzPaymentService.execute(dto.orderId);
  }

  @Post('sslcommerz/success')
  @ApiOperation({ summary: 'SSLCommerz payment success callback' })
  async sslCommerzSuccess(@Body() dto: SslCommerzCallbackDto, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const result = await this.validateSslCommerzPaymentService.execute(dto);

    if (result.success) {
      return res.redirect(
        `${frontendUrl}/checkout/success?orderNumber=${result.orderNumber || ''}&status=SUCCESS`,
      );
    }

    return res.redirect(`${frontendUrl}/checkout?status=FAIL`);
  }

  @Post('sslcommerz/fail')
  @ApiOperation({ summary: 'SSLCommerz payment fail callback' })
  async sslCommerzFail(@Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return res.redirect(`${frontendUrl}/checkout?status=FAIL`);
  }

  @Post('sslcommerz/cancel')
  @ApiOperation({ summary: 'SSLCommerz payment cancel callback' })
  async sslCommerzCancel(@Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return res.redirect(`${frontendUrl}/checkout?status=CANCEL`);
  }

  @Post('sslcommerz/ipn')
  @ApiOperation({ summary: 'SSLCommerz IPN Webhook callback' })
  async sslCommerzIpn(@Body() dto: SslCommerzCallbackDto) {
    return this.validateSslCommerzPaymentService.execute(dto);
  }

  // --- PROTECTED MERCHANT DASHBOARD ROUTES ---

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all payment transactions for merchant store' })
  @ApiResponse({ status: 200, description: 'List of store payment records' })
  async listMerchantPayments(@CurrentUser('sub') userId: string) {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.listMerchantPaymentsService.execute(tenantId);
  }
}
