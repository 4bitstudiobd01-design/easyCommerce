import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CouponEntity, DiscountTypeEnum } from '../entities/coupon.entity';

export interface ApplyCouponResult {
  code: string;
  discountAmount: number;
}

@Injectable()
export class ApplyCouponService {
  constructor(
    @InjectRepository(CouponEntity)
    private readonly couponRepository: Repository<CouponEntity>,
  ) {}

  /**
   * Re-validates the coupon server-side and atomically increments its usage
   * count. Never trust a discount amount computed on the client — this is the
   * only place a coupon's usedCount is incremented, and it must happen at the
   * same time an order is actually being created for it.
   */
  async execute(tenantId: string, code: string, orderSubtotal: number): Promise<ApplyCouponResult> {
    return this.couponRepository.manager.transaction(async (manager) => {
      const uppercaseCode = code.trim().toUpperCase();

      const coupon = await manager.findOne(CouponEntity, {
        where: { code: uppercaseCode, tenantId, isActive: true },
        lock: { mode: 'pessimistic_write' },
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

      let discountAmount = 0;
      if (coupon.discountType === DiscountTypeEnum.PERCENTAGE) {
        discountAmount = (orderSubtotal * Number(coupon.discountValue)) / 100;
      } else {
        discountAmount = Number(coupon.discountValue);
      }
      discountAmount = Math.min(discountAmount, orderSubtotal);

      coupon.usedCount += 1;
      await manager.save(coupon);

      return { code: coupon.code, discountAmount };
    });
  }
}
