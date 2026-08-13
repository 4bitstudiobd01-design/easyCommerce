import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProductEntity } from './product.entity';
import { ProductImageEntity } from './product-image.entity';

export interface VariantOptionMeta {
  attributeId: string;
  attributeName: string;
  optionId: string;
  optionLabel: string;
  value: string;
}

@Entity('product_variants')
@Index('IDX_product_variants_prod_id', ['productId'])
@Index('IDX_product_variants_tenant_id', ['tenantId'])
@Index('IDX_product_variants_tenant_sku', ['tenantId', 'sku'], { unique: true, where: '"sku" IS NOT NULL' })
@Index('IDX_product_variants_prod_comb', ['productId', 'combinationKey'], { unique: true, where: '"combinationKey" IS NOT NULL' })
export class ProductVariantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  title: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  price?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  compareAtPrice?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  costPrice?: number;

  @Column({ type: 'uuid', nullable: true })
  imageId?: string;

  @ManyToOne(() => ProductImageEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'imageId' })
  image?: ProductImageEntity;

  @Column({ type: 'boolean', default: true })
  isEnabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  combinationKey?: string;

  @Column({ type: 'jsonb', default: [] })
  options: VariantOptionMeta[];

  @Column({ type: 'jsonb', nullable: true })
  attributes?: Record<string, any>;

  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => ProductEntity, (product) => product.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: ProductEntity;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
