import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewEntity } from '../entities/review.entity';
import { ProductEntity } from '../entities/product.entity';
import { CreateReviewDto } from '../dto/create-review.dto';

@Injectable()
export class CreateReviewService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async execute(productId: string, dto: CreateReviewDto): Promise<ReviewEntity> {
    const product = await this.productRepository.findOne({ where: { id: productId } });

    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found.`);
    }

    const review = this.reviewRepository.create({
      rating: dto.rating,
      reviewerName: dto.reviewerName,
      reviewerEmail: dto.reviewerEmail,
      comment: dto.comment,
      images: dto.images || [],
      isVerifiedBuyer: true, // Default verified buyer for storefront orders
      isApproved: false, // Requires merchant approval by default
      productId: product.id,
      tenantId: product.tenantId,
    });

    return this.reviewRepository.save(review);
  }
}
