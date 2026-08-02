import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductEntity } from './product.entity';

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid', nullable: true })
  parentId?: string;

  @ManyToOne(() => CategoryEntity, (category) => category.subcategories, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parentCategory?: CategoryEntity;

  @OneToMany(() => CategoryEntity, (category) => category.parentCategory)
  subcategories: CategoryEntity[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon?: string;

  @Column({ type: 'text', nullable: true })
  image?: string;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'uuid' })
  tenantId: string;

  @OneToMany(() => ProductEntity, (product) => product.category)
  products: ProductEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
