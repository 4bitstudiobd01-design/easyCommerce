import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CouponEntity, DiscountTypeEnum } from '../entities/coupon.entity';
import { FindStoreBySlugService } from '../../tenant/services/find-store-by-slug.service';

export interface ValidateCouponResult {
  isValid: boolean;
  code: string;
  discountType: DiscountTypeEnum;
  discountValue: number;
  calculatedDiscount: number;
  message: string;
}

@Injectable()
export class ValidatePublicCouponService {
  constructor(
    @InjectRepository(CouponEntity)
    private readonly couponRepository: Repository<CouponEntity>,
    private readonly findStoreBySlugService: FindStoreBySlugService,
  ) {}

  async execute(storeSlug: string, code: string, orderSubtotal: number): Promise<ValidateCouponResult> {
    const store = await this.findStoreBySlugService.execute(storeSlug);
    const uppercaseCode = code.trim().toUpperCase();

    const coupon = await this.couponRepository.findOne({
      where: { code: uppercaseCode, tenantId: store.tenantId, isActive: true },
    });

    if (!coupon) {
      throw new NotFoundException(`Invalid promo coupon code "${uppercaseCode}".`);
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      throw new BadRequestException(`Promo coupon "${uppercaseCode}" has expired.`);
    }

    if (coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException(`Promo coupon "${uppercaseCode}" usage limit has been reached.`);
    }

    if (orderSubtotal < Number(coupon.minOrderAmount)) {
      throw new BadRequestException(
        `Minimum order amount of BDT ${Number(coupon.minOrderAmount).toLocaleString()} is required for promo coupon "${uppercaseCode}".`,
      );
    }

    let calculatedDiscount = 0;
    if (coupon.discountType === DiscountTypeEnum.PERCENTAGE) {
      calculatedDiscount = (orderSubtotal * Number(coupon.discountValue)) / 100;
    } else {
      calculatedDiscount = Number(coupon.discountValue);
    }

    // Discount cannot exceed subtotal
    calculatedDiscount = Math.min(calculatedDiscount, orderSubtotal);

    return {
      isValid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      calculatedDiscount,
      message: `Promo code "${coupon.code}" applied! Discount: BDT ${calculatedDiscount.toLocaleString()}`,
    };
  }
}
