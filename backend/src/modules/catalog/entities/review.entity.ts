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

@Entity('product_reviews')
@Index(['tenantId'])
@Index(['productId'])
@Index(['isApproved'])
export class ReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  rating: number; // 1 to 5

  @Column({ type: 'varchar', length: 255 })
  reviewerName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reviewerEmail?: string;

  @Column({ type: 'text' })
  comment: string;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  images?: string[];

  @Column({ type: 'boolean', default: false })
  isVerifiedBuyer: boolean;

  @Column({ type: 'boolean', default: false })
  isApproved: boolean;

  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => ProductEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: ProductEntity;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
