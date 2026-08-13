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
import { AttributeDefinitionEntity } from './attribute-definition.entity';

@Entity('product_attribute_values')
@Index('IDX_product_attr_values_prod_attr', ['productId', 'attributeId'], { unique: true })
@Index('IDX_product_attr_values_tenant', ['tenantId'])
export class ProductAttributeValueEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => ProductEntity, (prod) => prod.attributeValues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: ProductEntity;

  @Column({ type: 'uuid' })
  attributeId: string;

  @ManyToOne(() => AttributeDefinitionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attributeId' })
  attribute: AttributeDefinitionEntity;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
