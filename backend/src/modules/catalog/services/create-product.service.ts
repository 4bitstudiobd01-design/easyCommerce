import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { CategoryEntity } from '../entities/category.entity';
import { ProductImageEntity } from '../entities/product-image.entity';
import { ProductVariantEntity } from '../entities/product-variant.entity';
import { CollectionEntity } from '../entities/collection.entity';
import { InventoryStockEntity } from '../../inventory/entities/inventory-stock.entity';
import { InventoryMovementEntity } from '../../inventory/entities/inventory-movement.entity';
import { WarehouseEntity } from '../../inventory/entities/warehouse.entity';
import { MovementType } from '../../inventory/enums/inventory-movement-type.enum';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductSlugService } from './product-slug.service';
import { ProductType } from '../enums/product-type.enum';
import { ProductStatus } from '../enums/product-status.enum';
import { TaxCategory } from '../enums/tax-category.enum';
import { ProductDiscountType } from '../enums/product-discount-type.enum';

@Injectable()
export class CreateProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(ProductImageEntity)
    private readonly imageRepository: Repository<ProductImageEntity>,
    @InjectRepository(ProductVariantEntity)
    private readonly variantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(CollectionEntity)
    private readonly collectionRepository: Repository<CollectionEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly inventoryStockRepository: Repository<InventoryStockEntity>,
    @InjectRepository(InventoryMovementEntity)
    private readonly inventoryMovementRepository: Repository<InventoryMovementEntity>,
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepository: Repository<WarehouseEntity>,
    private readonly productSlugService: ProductSlugService,
  ) {}

  /**
   * inventory_stocks.warehouseId is NOT NULL, so a stock row cannot be written without
   * one. Resolve the tenant's default warehouse, creating it on first use the same way
   * ListWarehousesService does, so a merchant who has not set up warehouses yet can
   * still create products.
   */
  private async resolveDefaultWarehouseId(tenantId: string): Promise<string> {
    const existing = await this.warehouseRepository.findOne({
      where: { tenantId },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
    if (existing) return existing.id;

    const created = await this.warehouseRepository.save(
      this.warehouseRepository.create({
        name: 'Main Store Warehouse',
        code: 'WH-MAIN',
        isDefault: true,
        address: 'Main Store Location',
        tenantId,
      }),
    );
    return created.id;
  }

  async execute(tenantId: string, dto: CreateProductDto): Promise<ProductEntity> {
    const productName = dto.name || dto.title;
    if (!productName || !productName.trim()) {
      throw new BadRequestException('Product name is required');
    }

    const productType = dto.productType || ProductType.PHYSICAL;
    const status = dto.status || ProductStatus.DRAFT;
    const hasVariants = Boolean(dto.hasVariants);

    // A product that goes live must carry a real selling price. Variant products
    // set price per variant instead, so they are exempt at create time — the price
    // then lives on the generated variants. A draft can still be saved without one.
    if (status === ProductStatus.ACTIVE && !hasVariants && !(dto.basePrice && dto.basePrice > 0)) {
      throw new BadRequestException('Set a selling price greater than 0 before publishing this product.');
    }

    // Check SKU uniqueness in tenant scope
    const trimmedSku = dto.sku ? dto.sku.trim() : undefined;
    if (trimmedSku) {
      const existingSku = await this.productRepository.findOne({
        where: { sku: trimmedSku, tenantId },
      });
      if (existingSku) {
        throw new BadRequestException('SKU already exists.');
      }
    }

    // Check Barcode uniqueness in tenant scope
    const trimmedBarcode = dto.barcode ? dto.barcode.trim() : undefined;
    if (trimmedBarcode) {
      const existingBarcode = await this.productRepository.findOne({
        where: { barcode: trimmedBarcode, tenantId },
      });
      if (existingBarcode) {
        throw new BadRequestException('Barcode already exists.');
      }
    }

    // compareAtPrice is the struck-through "was" price, so it only makes sense when
    // it sits above the actual selling price — otherwise the storefront shows a
    // discount that raises the price.
    if (
      dto.compareAtPrice !== undefined &&
      dto.compareAtPrice > 0 &&
      dto.basePrice !== undefined &&
      dto.compareAtPrice <= dto.basePrice
    ) {
      throw new BadRequestException('Compare-at price must be higher than the selling price.');
    }

    // Validate discount schedule if provided
    if (dto.discountStartsAt && dto.discountEndsAt) {
      if (new Date(dto.discountEndsAt) <= new Date(dto.discountStartsAt)) {
        throw new BadRequestException('Discount schedule end date must be after start date');
      }
    }

    // Generate unique tenant-scoped slug
    const slugInput = dto.slug || productName;
    const slug = await this.productSlugService.generateSlug(slugInput, tenantId);

    let collections: CollectionEntity[] = [];
    if (dto.collectionIds && dto.collectionIds.length > 0) {
      collections = await this.collectionRepository.find({
        where: { id: In(dto.collectionIds), tenantId },
      });
    }

    // Validate category ownership within tenant scope
    let categoryId: string | undefined = undefined;
    if (dto.categoryId && dto.categoryId.trim() !== '' && dto.categoryId !== 'none') {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId, tenantId },
      });
      if (!category) {
        throw new BadRequestException('Category not found in this store');
      }
      categoryId = dto.categoryId;
    }

    // Mass assignment protection: explicitly construct allowed entity fields
    const product = this.productRepository.create({
      name: productName.trim(),
      slug,
      description: dto.description ? dto.description.trim() : undefined,
      productType,
      status,
      isPublished: status === ProductStatus.ACTIVE,
      publishedAt: status === ProductStatus.ACTIVE ? new Date() : undefined,
      isVisible: dto.isVisible !== undefined ? dto.isVisible : true,
      homepageSections: dto.homepageSections ?? [],
      hasVariants,
      sku: trimmedSku,
      barcode: trimmedBarcode,
      trackInventory: dto.trackInventory !== undefined ? dto.trackInventory : true,
      allowBackorder: Boolean(dto.allowBackorder),
      lowStockThreshold: dto.lowStockThreshold !== undefined ? dto.lowStockThreshold : 10,
      basePrice: dto.basePrice ?? 0,
      compareAtPrice: dto.compareAtPrice,
      costPrice: dto.costPrice,
      taxRate: dto.taxRate ?? 0,
      isTaxInclusive: Boolean(dto.isTaxInclusive),
      taxCategory: dto.taxCategory || TaxCategory.STANDARD_VAT,
      discountType: dto.discountType || ProductDiscountType.NONE,
      discountValue: dto.discountValue ?? 0,
      discountStartsAt: dto.discountStartsAt ? new Date(dto.discountStartsAt) : undefined,
      discountEndsAt: dto.discountEndsAt ? new Date(dto.discountEndsAt) : undefined,
      // --- SHIPPING & FULFILLMENT CONFIGURATION (CHUNK 10) ---
      shippingRequired: dto.shippingRequired !== undefined ? dto.shippingRequired : productType === ProductType.PHYSICAL,
      weight: dto.weight,
      weightUnit: dto.weightUnit,
      length: dto.length,
      width: dto.width,
      height: dto.height,
      dimensionUnit: dto.dimensionUnit,
      shippingProfileId: dto.shippingProfileId,
      isFragile: Boolean(dto.isFragile),
      digitalDeliveryType: dto.digitalDeliveryType,
      digitalAssetUrl: dto.digitalAssetUrl ? dto.digitalAssetUrl.trim() : undefined,
      downloadLimit: dto.downloadLimit,
      downloadExpiryDays: dto.downloadExpiryDays,
      serviceDeliveryType: dto.serviceDeliveryType,
      serviceDuration: dto.serviceDuration,
      serviceDurationUnit: dto.serviceDurationUnit,
      categoryId,
      brandId: dto.brandId,
      collections,
      tenantId,
    });

    const savedProduct = await this.productRepository.save(product);

    const warehouseId = await this.resolveDefaultWarehouseId(tenantId);

    // Where a product's stock lives depends on whether it has variants. A simple
    // product carries its stock on the product-level row itself, so the form's
    // "Initial Stock Quantity" seeds that row. A variant product sells from its
    // variants instead — each gets its own stock row seeded from the per-variant
    // quantity set in the Variants tab — so the product-level row is opened at 0
    // purely as a placeholder and the single form field is ignored.
    const productLevelStockQty =
      !hasVariants && dto.initialStock !== undefined && dto.initialStock > 0 ? dto.initialStock : 0;
    const inventoryStock = this.inventoryStockRepository.create({
      productId: savedProduct.id,
      warehouseId,
      quantityOnHand: productLevelStockQty,
      quantityReserved: 0,
      reorderPoint: savedProduct.lowStockThreshold,
      tenantId,
    });
    const savedStock = await this.inventoryStockRepository.save(inventoryStock);

    if (productLevelStockQty > 0) {
      const movement = this.inventoryMovementRepository.create({
        productId: savedProduct.id,
        inventoryStockId: savedStock.id,
        type: MovementType.INITIAL_STOCK,
        quantity: productLevelStockQty,
        previousQuantity: 0,
        newQuantity: productLevelStockQty,
        reason: 'Initial Stock',
        referenceType: 'CREATE_PRODUCT',
        tenantId,
      });
      await this.inventoryMovementRepository.save(movement);
    }

    // A product without variants keeps its price/SKU/stock on the product row itself
    // (basePrice, sku, inventory_stocks). No hidden "default variant" is created.
    //
    // When the merchant configured variants in the form, the frontend computes the
    // option combinations locally and sends them here, so a new product no longer
    // has to be saved first just to attach variants. Each variant also gets its own
    // inventory stock row (referenced by id, no FK cascade).
    if (hasVariants && dto.variants && dto.variants.length > 0) {
      for (const v of dto.variants) {
        const trimmedVariantSku = v.sku ? v.sku.trim() : undefined;
        const savedVariant = await this.variantRepository.save(
          this.variantRepository.create({
            title: v.title,
            sku: trimmedVariantSku || undefined,
            combinationKey: v.combinationKey || undefined,
            options: (v.options || []).map((o) => ({
              attributeId: o.attributeId,
              attributeName: o.attributeName,
              optionId: o.optionId,
              optionLabel: o.optionLabel,
              value: o.value,
            })),
            price: v.price ?? savedProduct.basePrice,
            compareAtPrice: v.compareAtPrice ?? savedProduct.compareAtPrice,
            costPrice: v.costPrice ?? savedProduct.costPrice,
            isEnabled: v.isEnabled !== undefined ? v.isEnabled : true,
            productId: savedProduct.id,
            tenantId,
          }),
        );

        const variantStockQty = v.initialStock !== undefined && v.initialStock > 0 ? v.initialStock : 0;
        const savedVariantStock = await this.inventoryStockRepository.save(
          this.inventoryStockRepository.create({
            productId: savedProduct.id,
            variantId: savedVariant.id,
            warehouseId,
            quantityOnHand: variantStockQty,
            quantityReserved: 0,
            reorderPoint: savedProduct.lowStockThreshold || 10,
            tenantId,
          }),
        );

        if (variantStockQty > 0) {
          await this.inventoryMovementRepository.save(
            this.inventoryMovementRepository.create({
              productId: savedProduct.id,
              variantId: savedVariant.id,
              inventoryStockId: savedVariantStock.id,
              type: MovementType.INITIAL_STOCK,
              quantity: variantStockQty,
              previousQuantity: 0,
              newQuantity: variantStockQty,
              reason: 'Initial Stock',
              referenceType: 'CREATE_PRODUCT',
              tenantId,
            }),
          );
        }
      }
    }

    // Create product gallery images if provided
    if (dto.images && dto.images.length > 0) {
      for (let index = 0; index < dto.images.length; index++) {
        const img = dto.images[index];
        const productImage = this.imageRepository.create({
          url: img.url.trim(),
          altText: img.altText ? img.altText.trim() : productName.trim(),
          isPrimary: img.isPrimary !== undefined ? img.isPrimary : index === 0,
          sortOrder: img.sortOrder !== undefined ? img.sortOrder : index,
          productId: savedProduct.id,
          tenantId,
        });
        await this.imageRepository.save(productImage);
      }
    } else if (dto.imageUrl) {
      const productImage = this.imageRepository.create({
        url: dto.imageUrl.trim(),
        altText: productName.trim(),
        isPrimary: true,
        sortOrder: 0,
        productId: savedProduct.id,
        tenantId,
      });
      await this.imageRepository.save(productImage);
    }

    return this.productRepository.findOne({
      where: { id: savedProduct.id, tenantId },
      relations: ['category', 'brand', 'collections', 'variants', 'images'],
    }) as Promise<ProductEntity>;
  }
}
