import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CouponEntity } from '../entities/coupon.entity';
import { CreateCouponDto } from '../dto/create-coupon.dto';

@Injectable()
export class CreateCouponService {
  constructor(
    @InjectRepository(CouponEntity)
    private readonly couponRepository: Repository<CouponEntity>,
  ) {}

  async execute(tenantId: string, dto: CreateCouponDto): Promise<CouponEntity> {
    const uppercaseCode = dto.code.trim().toUpperCase();

    const existingCoupon = await this.couponRepository.findOne({
      where: { code: uppercaseCode, tenantId },
    });

    if (existingCoupon) {
      throw new BadRequestException(`Coupon code "${uppercaseCode}" already exists for your store.`);
    }

    const coupon = this.couponRepository.create({
      code: uppercaseCode,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      minOrderAmount: dto.minOrderAmount || 0,
      maxUses: dto.maxUses || 100,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      tenantId,
    });

    return this.couponRepository.save(coupon);
  }
}
