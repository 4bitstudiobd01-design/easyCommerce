import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewEntity } from '../entities/review.entity';

@Injectable()
export class ModerateReviewService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
  ) {}

  async toggleApproval(reviewId: string, tenantId: string, isApproved: boolean): Promise<ReviewEntity> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId, tenantId } });

    if (!review) {
      throw new NotFoundException(`Review with ID "${reviewId}" not found.`);
    }

    review.isApproved = isApproved;
    return this.reviewRepository.save(review);
  }

  async deleteReview(reviewId: string, tenantId: string): Promise<void> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId, tenantId } });

    if (!review) {
      throw new NotFoundException(`Review with ID "${reviewId}" not found.`);
    }

    await this.reviewRepository.remove(review);
  }
}
