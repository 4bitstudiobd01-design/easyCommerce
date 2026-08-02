import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewEntity } from '../entities/review.entity';

@Injectable()
export class ListProductReviewsService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
  ) {}

  async listApprovedForProduct(productId: string): Promise<{ reviews: ReviewEntity[]; avgRating: number; totalCount: number }> {
    const reviews = await this.reviewRepository.find({
      where: { productId, isApproved: true },
      order: { createdAt: 'DESC' },
    });

    const totalCount = reviews.length;
    const avgRating =
      totalCount > 0
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1))
        : 5.0;

    return { reviews, avgRating, totalCount };
  }

  async listAllForMerchant(tenantId: string): Promise<ReviewEntity[]> {
    return this.reviewRepository.find({
      where: { tenantId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }
}
