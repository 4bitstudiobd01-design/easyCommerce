import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CouponEntity } from '../entities/coupon.entity';

@Injectable()
export class ListMerchantCouponsService {
  constructor(
    @InjectRepository(CouponEntity)
    private readonly couponRepository: Repository<CouponEntity>,
  ) {}

  async execute(tenantId: string): Promise<CouponEntity[]> {
    return this.couponRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }
}
