import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GetTenantIdForUserService } from './services/get-tenant-id-for-user.service';
import { GetMySubscriptionService } from './services/get-my-subscription.service';
import { ListPlansService } from './services/list-plans.service';
import { InitiatePlanRenewalPaymentService } from './services/initiate-plan-renewal-payment.service';
import { ValidatePlanRenewalPaymentService } from './services/validate-plan-renewal-payment.service';
import { InitiatePlanRenewalDto } from './dto/initiate-plan-renewal.dto';

@ApiTags('Billing & Subscriptions')
@Controller('billing')
export class BillingController {
  constructor(
    private readonly getTenantIdForUserService: GetTenantIdForUserService,
    private readonly getMySubscriptionService: GetMySubscriptionService,
    private readonly listPlansService: ListPlansService,
    private readonly initiatePlanRenewalPaymentService: InitiatePlanRenewalPaymentService,
    private readonly validatePlanRenewalPaymentService: ValidatePlanRenewalPaymentService,
    private readonly configService: ConfigService,
  ) {}

  @Get('plans')
  @ApiOperation({ summary: 'List all available subscription plans (Public)' })
  @ApiResponse({ status: 200, description: 'List of plans' })
  async listPlans() {
    return this.listPlansService.execute();
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current merchant\'s active subscription and plan' })
  @ApiResponse({ status: 200, description: 'Current subscription snapshot' })
  async getMySubscription(@CurrentUser('sub') userId: string) {
    const tenantId = await this.getTenantIdForUserService.execute(userId);
    return this.getMySubscriptionService.execute(tenantId);
  }

  @Post('subscription/renew')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate SSLCommerz payment to upgrade or renew a paid plan' })
  @ApiResponse({ status: 201, description: 'SSLCommerz Gateway URL returned' })
  async renewSubscription(
    @CurrentUser('sub') userId: string,
    @CurrentUser('email') email: string,
    @Body() dto: InitiatePlanRenewalDto,
  ) {
    const tenantId = await this.getTenantIdForUserService.execute(userId);
    return this.initiatePlanRenewalPaymentService.execute(tenantId, dto.planCode, email);
  }

  // --- SSLCommerz Payment Redirect Callback Routes (public) ---

  @Post('payment/sslcommerz/success')
  @Get('payment/sslcommerz/success')
  @ApiOperation({ summary: 'SSLCommerz subscription payment success callback' })
  async paymentSuccess(@Req() req: Request, @Res() res: Response, @Query('invoiceId') invoiceId: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const payload = { ...req.query, ...req.body };

    const result = await this.validatePlanRenewalPaymentService.execute(invoiceId, payload.val_id);

    if (result.success) {
      return res.redirect(`${frontendUrl}/dashboard/settings/billing?payment=success`);
    }
    return res.redirect(`${frontendUrl}/dashboard/settings/billing?payment=failed`);
  }

  @Post('payment/sslcommerz/fail')
  @Get('payment/sslcommerz/fail')
  @ApiOperation({ summary: 'SSLCommerz subscription payment failure callback' })
  async paymentFail(@Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return res.redirect(`${frontendUrl}/dashboard/settings/billing?payment=failed`);
  }

  @Post('payment/sslcommerz/cancel')
  @Get('payment/sslcommerz/cancel')
  @ApiOperation({ summary: 'SSLCommerz subscription payment cancellation callback' })
  async paymentCancel(@Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return res.redirect(`${frontendUrl}/dashboard/settings/billing?payment=cancelled`);
  }

  @Post('payment/sslcommerz/ipn')
  @ApiOperation({ summary: 'SSLCommerz subscription payment IPN webhook' })
  async paymentIpn(@Req() req: Request, @Query('invoiceId') invoiceId: string) {
    const payload = { ...req.query, ...req.body };
    return this.validatePlanRenewalPaymentService.execute(invoiceId, payload.val_id);
  }
}
