import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';
import { CategoryEntity } from './category.entity';
import { BrandEntity } from './brand.entity';
import { CollectionEntity } from './collection.entity';
import { ProductVariantEntity } from './product-variant.entity';
import { ProductImageEntity } from './product-image.entity';
import { ProductAttributeValueEntity } from './product-attribute-value.entity';
import { ShippingProfileEntity } from './shipping-profile.entity';
import { ProductType } from '../enums/product-type.enum';
import { ProductStatus } from '../enums/product-status.enum';
import { TaxCategory } from '../enums/tax-category.enum';
import { ProductDiscountType } from '../enums/product-discount-type.enum';
import { HomepageSection } from '../enums/homepage-section.enum';
import {
  WeightUnit,
  DimensionUnit,
  DigitalDeliveryType,
  ServiceDeliveryType,
  ServiceDurationUnit,
} from '../enums/fulfillment.enum';

@Entity('products')
@Index('IDX_products_tenant_slug', ['tenantId', 'slug'], { unique: true })
@Index('IDX_products_tenant_status', ['tenantId', 'status'])
@Index('IDX_products_tenant_type', ['tenantId', 'productType'])
@Index('IDX_products_tenant_category', ['tenantId', 'categoryId'])
@Index('IDX_products_tenant_brand', ['tenantId', 'brandId'])
@Index('IDX_products_tenant_sortOrder', ['tenantId', 'sortOrder'])
@Index('IDX_products_tenant_isVisible', ['tenantId', 'isVisible'])
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: ProductType, default: ProductType.PHYSICAL })
  productType: ProductType;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus;

  // --- INVENTORY & STOCK FIELDS (CHUNK 8) ---
  @Column({ type: 'varchar', length: 100, nullable: true })
  sku?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode?: string;

  @Column({ type: 'boolean', default: true })
  trackInventory: boolean;

  @Column({ type: 'boolean', default: false })
  allowBackorder: boolean;

  @Column({ type: 'integer', default: 10 })
  lowStockThreshold: number;

  @Column({ type: 'boolean', default: false })
  hasVariants: boolean;

  // --- PRICING & FINANCIAL PERSISTENCE (DECIMAL 12,2) ---
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  basePrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  compareAtPrice?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  costPrice?: number;

  // --- TAX CONFIGURATION ---
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ type: 'boolean', default: false })
  isTaxInclusive: boolean;

  @Column({ type: 'enum', enum: TaxCategory, default: TaxCategory.STANDARD_VAT })
  taxCategory: TaxCategory;

  // --- PRODUCT-LEVEL DISCOUNT CONFIGURATION ---
  @Column({ type: 'enum', enum: ProductDiscountType, default: ProductDiscountType.NONE })
  discountType: ProductDiscountType;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountValue: number;

  @Column({ type: 'timestamptz', nullable: true })
  discountStartsAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  discountEndsAt?: Date;

  @Column({ type: 'boolean', default: false })
  isPublished: boolean;

  // Set the first time a product goes ACTIVE and preserved afterwards, so the details
  // page can show when it actually went live rather than reusing updatedAt.
  @Column({ type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  /**
   * Independent of `status`/`isPublished` — lets a merchant pause a product's
   * storefront visibility (e.g. temporarily out of stock, seasonal) without
   * changing its lifecycle status. The public storefront query requires BOTH
   * isPublished AND isVisible to be true.
   */
  @Column({ type: 'boolean', default: true })
  isVisible: boolean;

  /** Global per-tenant display order, set only via the reorder endpoint — never via create/update DTOs. */
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  /** Which homepage sections (Hero/Featured, New Arrivals, Best Sellers) this product is curated into. */
  @Column({ type: 'enum', enum: HomepageSection, array: true, default: [] })
  homepageSections: HomepageSection[];

  // --- SHIPPING & FULFILLMENT CONFIGURATION (CHUNK 10) ---
  @Column({ type: 'boolean', default: true })
  shippingRequired: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weight?: number;

  @Column({ type: 'enum', enum: WeightUnit, default: WeightUnit.KG })
  weightUnit: WeightUnit;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  length?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  width?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  height?: number;

  @Column({ type: 'enum', enum: DimensionUnit, default: DimensionUnit.CM })
  dimensionUnit: DimensionUnit;

  @Column({ type: 'uuid', nullable: true })
  shippingProfileId?: string;

  @ManyToOne(() => ShippingProfileEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'shippingProfileId' })
  shippingProfile?: ShippingProfileEntity;

  @Column({ type: 'boolean', default: false })
  isFragile: boolean;

  // --- DIGITAL DELIVERY CONFIGURATION ---
  @Column({ type: 'enum', enum: DigitalDeliveryType, nullable: true })
  digitalDeliveryType?: DigitalDeliveryType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  digitalAssetUrl?: string;

  @Column({ type: 'integer', nullable: true })
  downloadLimit?: number;

  @Column({ type: 'integer', nullable: true })
  downloadExpiryDays?: number;

  // --- SERVICE CONFIGURATION ---
  @Column({ type: 'enum', enum: ServiceDeliveryType, nullable: true })
  serviceDeliveryType?: ServiceDeliveryType;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  serviceDuration?: number;

  @Column({ type: 'enum', enum: ServiceDurationUnit, nullable: true })
  serviceDurationUnit?: ServiceDurationUnit;

  // --- PRODUCT SEO CONFIGURATION (CHUNK 12) ---
  @Column({ type: 'varchar', length: 255, nullable: true })
  seoTitle?: string;

  @Column({ type: 'text', nullable: true })
  metaDescription?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  canonicalUrl?: string;

  @Column({ type: 'boolean', default: true })
  isSearchEngineIndexed: boolean;

  @Column({ type: 'uuid', nullable: true })
  categoryId?: string;

  @ManyToOne(() => CategoryEntity, (category) => category.products, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category?: CategoryEntity;

  @Column({ type: 'uuid', nullable: true })
  brandId?: string;

  @ManyToOne(() => BrandEntity, (brand) => brand.products, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brandId' })
  brand?: BrandEntity;

  @ManyToMany(() => CollectionEntity, (collection) => collection.products)
  @JoinTable({
    name: 'product_collections',
    joinColumn: { name: 'productId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'collectionId', referencedColumnName: 'id' },
  })
  collections?: CollectionEntity[];

  @OneToMany(() => ProductVariantEntity, (variant) => variant.product, { cascade: true })
  variants: ProductVariantEntity[];

  @OneToMany(() => ProductImageEntity, (image) => image.product, { cascade: true })
  images: ProductImageEntity[];

  @OneToMany(() => ProductAttributeValueEntity, (attrVal) => attrVal.product, { cascade: true })
  attributeValues: ProductAttributeValueEntity[];

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Backward compatibility alias for title
  get title(): string {
    return this.name;
  }

  set title(val: string) {
    this.name = val;
  }
}
