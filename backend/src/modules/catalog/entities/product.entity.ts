import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { CategoryEntity } from './category.entity';
import { ProductVariantEntity } from './product-variant.entity';
import { ProductImageEntity } from './product-image.entity';


@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  basePrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  compareAtPrice?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  costPrice?: number;

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @Column({ type: 'uuid', nullable: true })
  categoryId?: string;

  @ManyToOne(() => CategoryEntity, (category) => category.products, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category?: CategoryEntity;

  @OneToMany(() => ProductVariantEntity, (variant) => variant.product, { cascade: true })
  variants: ProductVariantEntity[];

  @OneToMany(() => ProductImageEntity, (image) => image.product, { cascade: true })
  images: ProductImageEntity[];

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
