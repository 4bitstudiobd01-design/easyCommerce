import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CategoryEntity } from './category.entity';
import { AttributeDefinitionEntity } from './attribute-definition.entity';

@Entity('category_attributes')
@Index('IDX_category_attributes_cat_attr', ['categoryId', 'attributeId'], { unique: true })
export class CategoryAttributeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => CategoryEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: CategoryEntity;

  @Column({ type: 'uuid' })
  attributeId: string;

  @ManyToOne(() => AttributeDefinitionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attributeId' })
  attribute: AttributeDefinitionEntity;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
