import {
  Controller,
  Get,
  Post,
  Param,
  Headers,
  Body,
  Res,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FindStoreByUserService } from './services/find-store-by-user.service';
import { ListAvailableThemesService } from './services/list-available-themes.service';
import { PurchaseThemeService } from './services/purchase-theme.service';
import { ActivateThemeService } from './services/activate-theme.service';
import { InitiateThemeSslCommerzPaymentService } from './services/initiate-theme-sslcommerz-payment.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThemePurchaseEntity } from './entities/theme-purchase.entity';
import { StoreEntity } from './entities/store.entity';
import { ConfigService } from '@nestjs/config';

@ApiTags('Storefront Theme System & SSLCommerz Payment')
@Controller('tenant/themes')
export class ThemeController {
  constructor(
    private readonly listAvailableThemesService: ListAvailableThemesService,
    private readonly purchaseThemeService: PurchaseThemeService,
    private readonly activateThemeService: ActivateThemeService,
    private readonly initiateThemeSslCommerzPaymentService: InitiateThemeSslCommerzPaymentService,
    private readonly findStoreByUserService: FindStoreByUserService,
    private readonly configService: ConfigService,
    @InjectRepository(ThemePurchaseEntity)
    private readonly purchaseRepository: Repository<ThemePurchaseEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
  ) {}

  private async getStoreContext(userId: string, storeIdHeader?: string) {
    const store = await this.findStoreByUserService.execute(userId, storeIdHeader);
    if (!store) {
      throw new BadRequestException('Merchant store context not found.');
    }
    return store;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all available themes and store unlock status' })
  @ApiResponse({ status: 200, description: 'Catalog of storefront themes' })
  async getThemes(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listAvailableThemesService.execute(store.id);
  }

  @Post(':themeId/initiate-payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate SSLCommerz payment gateway session to purchase premium theme' })
  @ApiResponse({ status: 200, description: 'SSLCommerz Gateway URL returned' })
  async initiateThemePayment(
    @CurrentUser('sub') userId: string,
    @CurrentUser('email') email: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('themeId') themeId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.initiateThemeSslCommerzPaymentService.execute(
      store.tenantId,
      store.id,
      themeId,
      email,
      store.name,
    );
  }

  @Post(':themeId/activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate an unlocked storefront theme' })
  @ApiResponse({ status: 200, description: 'Theme activated successfully' })
  async activateTheme(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('themeId') themeId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.activateThemeService.execute(store.id, themeId);
  }

  // --- SSLCommerz Payment Redirect Callback Routes ---

  @Post('payment/sslcommerz/success')
  @ApiOperation({ summary: 'SSLCommerz payment success callback' })
  async paymentSuccess(
    @Query('purchaseId') purchaseId: string,
    @Query('themeId') themeId: string,
    @Query('storeId') storeId: string,
    @Res() res: any,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    try {
      if (purchaseId) {
        const purchase = await this.purchaseRepository.findOne({ where: { id: purchaseId } });
        if (purchase) {
          purchase.status = 'COMPLETED';
          await this.purchaseRepository.save(purchase);
        }
      }

      if (storeId && themeId) {
        const store = await this.storeRepository.findOne({ where: { id: storeId } });
        if (store) {
          const unlocked = new Set(store.unlockedThemeIds || ['DEFAULT_MODERN']);
          unlocked.add(themeId);
          store.unlockedThemeIds = Array.from(unlocked);
          store.activeThemeId = themeId;
          await this.storeRepository.save(store);
        }
      }

      return res.redirect(`${frontendUrl}/dashboard?theme_payment=success&themeId=${themeId}`);
    } catch (err) {
      return res.redirect(`${frontendUrl}/dashboard?theme_payment=error`);
    }
  }

  @Post('payment/sslcommerz/fail')
  @ApiOperation({ summary: 'SSLCommerz payment failure callback' })
  async paymentFail(@Query('purchaseId') purchaseId: string, @Res() res: any) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    if (purchaseId) {
      const purchase = await this.purchaseRepository.findOne({ where: { id: purchaseId } });
      if (purchase) {
        purchase.status = 'FAILED';
        await this.purchaseRepository.save(purchase);
      }
    }
    return res.redirect(`${frontendUrl}/dashboard?theme_payment=failed`);
  }

  @Post('payment/sslcommerz/cancel')
  @ApiOperation({ summary: 'SSLCommerz payment cancellation callback' })
  async paymentCancel(@Query('purchaseId') purchaseId: string, @Res() res: any) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    if (purchaseId) {
      const purchase = await this.purchaseRepository.findOne({ where: { id: purchaseId } });
      if (purchase) {
        purchase.status = 'CANCELLED';
        await this.purchaseRepository.save(purchase);
      }
    }
    return res.redirect(`${frontendUrl}/dashboard?theme_payment=cancelled`);
  }
}
