import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { CollectionEntity } from '../entities/collection.entity';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductSlugService } from './product-slug.service';
import { ProductStatus } from '../enums/product-status.enum';

@Injectable()
export class UpdateProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(CollectionEntity)
    private readonly collectionRepository: Repository<CollectionEntity>,
    private readonly productSlugService: ProductSlugService,
  ) {}

  async execute(id: string, tenantId: string, dto: UpdateProductDto): Promise<ProductEntity> {
    const product = await this.productRepository.findOne({
      where: { id, tenantId },
      relations: ['category', 'brand', 'collections', 'variants', 'images'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const updatedName = dto.name || dto.title;
    if (updatedName !== undefined && (!updatedName || !updatedName.trim())) {
      throw new BadRequestException('Product name cannot be empty');
    }

    if (updatedName && updatedName.trim() !== product.name) {
      product.name = updatedName.trim();
      const slugInput = dto.slug || product.name;
      product.slug = await this.productSlugService.generateSlug(slugInput, tenantId, id);
    } else if (dto.slug && dto.slug !== product.slug) {
      product.slug = await this.productSlugService.generateSlug(dto.slug, tenantId, id);
    }

    if (dto.description !== undefined) {
      product.description = dto.description ? dto.description.trim() : undefined;
    }

    if (dto.productType !== undefined) {
      product.productType = dto.productType;
    }

    if (dto.status !== undefined) {
      product.status = dto.status;
      product.isPublished = dto.status === ProductStatus.ACTIVE;

      // Stamp the first publish only; re-publishing later must not rewrite the
      // original go-live date.
      if (dto.status === ProductStatus.ACTIVE && !product.publishedAt) {
        product.publishedAt = new Date();
      }
    }

    // SKU uniqueness validation
    if (dto.sku !== undefined) {
      const trimmedSku = dto.sku ? dto.sku.trim() : undefined;
      if (trimmedSku && trimmedSku !== product.sku) {
        const existingSku = await this.productRepository.findOne({
          where: { sku: trimmedSku, tenantId, id: Not(id) },
        });
        if (existingSku) {
          throw new BadRequestException('SKU already exists.');
        }
      }
      product.sku = trimmedSku;
    }

    // Barcode uniqueness validation
    if (dto.barcode !== undefined) {
      const trimmedBarcode = dto.barcode ? dto.barcode.trim() : undefined;
      if (trimmedBarcode && trimmedBarcode !== product.barcode) {
        const existingBarcode = await this.productRepository.findOne({
          where: { barcode: trimmedBarcode, tenantId, id: Not(id) },
        });
        if (existingBarcode) {
          throw new BadRequestException('Barcode already exists.');
        }
      }
      product.barcode = trimmedBarcode;
    }

    if (dto.trackInventory !== undefined) {
      product.trackInventory = Boolean(dto.trackInventory);
    }

    if (dto.allowBackorder !== undefined) {
      product.allowBackorder = Boolean(dto.allowBackorder);
    }

    if (dto.lowStockThreshold !== undefined) {
      product.lowStockThreshold = dto.lowStockThreshold;
    }

    if (dto.basePrice !== undefined) {
      product.basePrice = dto.basePrice;
    }

    if (dto.compareAtPrice !== undefined) {
      product.compareAtPrice = dto.compareAtPrice;
    }

    if (dto.costPrice !== undefined) {
      product.costPrice = dto.costPrice;
    }

    if (dto.taxRate !== undefined) {
      product.taxRate = dto.taxRate;
    }

    if (dto.isTaxInclusive !== undefined) {
      product.isTaxInclusive = Boolean(dto.isTaxInclusive);
    }

    if (dto.taxCategory !== undefined) {
      product.taxCategory = dto.taxCategory;
    }

    if (dto.discountType !== undefined) {
      product.discountType = dto.discountType;
    }

    if (dto.discountValue !== undefined) {
      product.discountValue = dto.discountValue;
    }

    if (dto.discountStartsAt !== undefined) {
      product.discountStartsAt = dto.discountStartsAt ? new Date(dto.discountStartsAt) : undefined;
    }

    if (dto.discountEndsAt !== undefined) {
      product.discountEndsAt = dto.discountEndsAt ? new Date(dto.discountEndsAt) : undefined;
    }

    // Schedule validation
    if (product.discountStartsAt && product.discountEndsAt) {
      if (product.discountEndsAt <= product.discountStartsAt) {
        throw new BadRequestException('Discount schedule end date must be after start date');
      }
    }

    // --- SHIPPING & FULFILLMENT FIELDS (CHUNK 10) ---
    if (dto.shippingRequired !== undefined) {
      product.shippingRequired = Boolean(dto.shippingRequired);
    }

    if (dto.weight !== undefined) {
      product.weight = dto.weight;
    }

    if (dto.weightUnit !== undefined) {
      product.weightUnit = dto.weightUnit;
    }

    if (dto.length !== undefined) {
      product.length = dto.length;
    }

    if (dto.width !== undefined) {
      product.width = dto.width;
    }

    if (dto.height !== undefined) {
      product.height = dto.height;
    }

    if (dto.dimensionUnit !== undefined) {
      product.dimensionUnit = dto.dimensionUnit;
    }

    if (dto.shippingProfileId !== undefined) {
      product.shippingProfileId = dto.shippingProfileId;
    }

    if (dto.isFragile !== undefined) {
      product.isFragile = Boolean(dto.isFragile);
    }

    if (dto.digitalDeliveryType !== undefined) {
      product.digitalDeliveryType = dto.digitalDeliveryType;
    }

    if (dto.digitalAssetUrl !== undefined) {
      product.digitalAssetUrl = dto.digitalAssetUrl ? dto.digitalAssetUrl.trim() : undefined;
    }

    if (dto.downloadLimit !== undefined) {
      product.downloadLimit = dto.downloadLimit;
    }

    if (dto.downloadExpiryDays !== undefined) {
      product.downloadExpiryDays = dto.downloadExpiryDays;
    }

    if (dto.serviceDeliveryType !== undefined) {
      product.serviceDeliveryType = dto.serviceDeliveryType;
    }

    if (dto.serviceDuration !== undefined) {
      product.serviceDuration = dto.serviceDuration;
    }

    if (dto.serviceDurationUnit !== undefined) {
      product.serviceDurationUnit = dto.serviceDurationUnit;
    }

    if (dto.categoryId !== undefined) {
      product.categoryId = dto.categoryId;
    }

    if (dto.brandId !== undefined) {
      product.brandId = dto.brandId;
    }

    if (dto.collectionIds !== undefined) {
      if (dto.collectionIds.length > 0) {
        product.collections = await this.collectionRepository.find({
          where: { id: In(dto.collectionIds), tenantId },
        });
      } else {
        product.collections = [];
      }
    }

    await this.productRepository.save(product);

    return this.productRepository.findOne({
      where: { id, tenantId },
      relations: ['category', 'brand', 'collections', 'variants', 'images'],
    }) as Promise<ProductEntity>;
  }
}
