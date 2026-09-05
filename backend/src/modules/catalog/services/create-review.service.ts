import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewEntity } from '../entities/review.entity';
import { ProductEntity } from '../entities/product.entity';
import { CreateReviewDto } from '../dto/create-review.dto';
import { StoreEntity } from '../../tenant/entities/store.entity';

@Injectable()
export class CreateReviewService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    // Read-only lookup only (allowCustomerReviews / autoApproveReviews store
    // preferences) — TenantModule exports TypeOrmModule so this repository is
    // already available here without a circular module dependency.
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
  ) {}

  async execute(productId: string, dto: CreateReviewDto): Promise<ReviewEntity> {
    const product = await this.productRepository.findOne({ where: { id: productId } });

    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found.`);
    }

    const store = await this.storeRepository.findOne({ where: { tenantId: product.tenantId } });

    if (store && store.allowCustomerReviews === false) {
      throw new ForbiddenException('This store is not accepting product reviews right now.');
    }

    const review = this.reviewRepository.create({
      rating: dto.rating,
      reviewerName: dto.reviewerName,
      reviewerEmail: dto.reviewerEmail,
      comment: dto.comment,
      images: dto.images || [],
      isVerifiedBuyer: true, // Default verified buyer for storefront orders
      isApproved: store?.autoApproveReviews ?? true, // Requires merchant approval when disabled
      productId: product.id,
      tenantId: product.tenantId,
    });

    return this.reviewRepository.save(review);
  }
}
