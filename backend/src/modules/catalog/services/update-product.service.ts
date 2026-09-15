import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { CategoryEntity } from '../entities/category.entity';
import { CollectionEntity } from '../entities/collection.entity';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductSlugService } from './product-slug.service';
import { ProductStatus } from '../enums/product-status.enum';

@Injectable()
export class UpdateProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
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

    if (dto.hasVariants !== undefined) {
      product.hasVariants = Boolean(dto.hasVariants);
    }

    if (dto.basePrice !== undefined) {
      product.basePrice = dto.basePrice;
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

    // A product that goes live must carry a real selling price. Only enforced when
    // this request actually sets the product ACTIVE — an unrelated edit to an
    // already-live product is left alone. For a variant product the price lives on
    // the variants, so require at least one enabled variant priced above 0;
    // otherwise require the product's own basePrice.
    if (dto.status === ProductStatus.ACTIVE) {
      if (product.hasVariants) {
        const hasPricedVariant = (product.variants || []).some(
          (v) => v.isEnabled && Number(v.price) > 0,
        );
        if (!hasPricedVariant) {
          throw new BadRequestException(
            'Add at least one enabled variant with a price greater than 0 before publishing this product.',
          );
        }
      } else if (!(Number(product.basePrice) > 0)) {
        throw new BadRequestException('Set a selling price greater than 0 before publishing this product.');
      }
    }

    if (dto.isVisible !== undefined) {
      product.isVisible = dto.isVisible;
    }

    if (dto.homepageSections !== undefined) {
      product.homepageSections = dto.homepageSections;
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

    if (dto.compareAtPrice !== undefined) {
      product.compareAtPrice = dto.compareAtPrice;
    }

    // compareAtPrice is the struck-through "was" price — it must stay above the
    // selling price or the storefront shows a discount that raises the price.
    // Checked against the merged values so changing either field alone is caught.
    if (
      product.compareAtPrice !== undefined &&
      product.compareAtPrice !== null &&
      Number(product.compareAtPrice) > 0 &&
      Number(product.compareAtPrice) <= Number(product.basePrice)
    ) {
      throw new BadRequestException('Compare-at price must be higher than the selling price.');
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
      if (dto.categoryId && dto.categoryId.trim() !== '' && dto.categoryId !== 'none') {
        const category = await this.categoryRepository.findOne({
          where: { id: dto.categoryId, tenantId },
        });
        if (!category) {
          throw new NotFoundException('Category not found in this store');
        }
        product.categoryId = dto.categoryId;
      } else {
        product.categoryId = undefined;
      }
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
