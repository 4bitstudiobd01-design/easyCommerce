import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreEntity } from '../entities/store.entity';
import { ThemePurchaseEntity } from '../entities/theme-purchase.entity';
import { THEME_CATALOG } from './list-available-themes.service';

@Injectable()
export class PurchaseThemeService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @InjectRepository(ThemePurchaseEntity)
    private readonly purchaseRepository: Repository<ThemePurchaseEntity>,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    themeId: string,
    paymentMethod: string = 'SSLCOMMERZ',
  ): Promise<{ success: boolean; message: string; activeThemeId: string; unlockedThemeIds: string[] }> {
    const store = await this.storeRepository.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('Store not found.');
    }

    const themeDef = THEME_CATALOG.find((t) => t.id === themeId);
    if (!themeDef) {
      throw new NotFoundException('Invalid theme ID.');
    }

    const unlockedSet = new Set(store.unlockedThemeIds || ['DEFAULT_MODERN']);

    if (unlockedSet.has(themeId)) {
      store.activeThemeId = themeId;
      await this.storeRepository.save(store);
      return {
        success: true,
        message: `Theme "${themeDef.name}" is already unlocked and is now active!`,
        activeThemeId: store.activeThemeId,
        unlockedThemeIds: Array.from(unlockedSet),
      };
    }

    // Require REAL Payment Gateway for Premium Themes
    if (!themeDef.isFree && themeDef.price > 0) {
      if (paymentMethod !== 'COMPLETED_BY_SSLCOMMERZ') {
        throw new BadRequestException(
          `Payment Required: Theme "${themeDef.name}" costs ৳${themeDef.price.toLocaleString()} BDT. Please complete payment via SSLCommerz (bKash/Nagad/Cards) to unlock.`,
        );
      }
    }

    // Complete Purchase Transaction
    const purchase = this.purchaseRepository.create({
      tenantId,
      storeId,
      themeId,
      price: themeDef.price,
      status: 'COMPLETED',
      paymentMethod,
    });
    await this.purchaseRepository.save(purchase);

    unlockedSet.add(themeId);
    store.unlockedThemeIds = Array.from(unlockedSet);
    store.activeThemeId = themeId;
    if (themeDef.primaryColorDefault) {
      store.primaryColor = themeDef.primaryColorDefault;
    }

    await this.storeRepository.save(store);

    return {
      success: true,
      message: `Payment Verified! Theme "${themeDef.name}" unlocked successfully and is now active for your store!`,
      activeThemeId: store.activeThemeId,
      unlockedThemeIds: store.unlockedThemeIds,
    };
  }
}
