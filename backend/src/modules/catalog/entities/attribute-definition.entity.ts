import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { AttributeType } from '../enums/attribute-type.enum';
import { AttributeOptionEntity } from './attribute-option.entity';

@Entity('attribute_definitions')
@Index('IDX_attribute_definitions_tenant_key', ['tenantId', 'key'], { unique: true })
@Index('IDX_attribute_definitions_tenant_slug', ['tenantId', 'slug'])
export class AttributeDefinitionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @Column({ type: 'varchar', length: 255 })
  key: string;

  @Column({ type: 'enum', enum: AttributeType, default: AttributeType.TEXT })
  type: AttributeType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: false })
  isRequired: boolean;

  @Column({ type: 'boolean', default: true })
  isFilterable: boolean;

  @Column({ type: 'boolean', default: false })
  isVariantOption: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'uuid' })
  tenantId: string;

  @OneToMany(() => AttributeOptionEntity, (option) => option.attribute, { cascade: true })
  options: AttributeOptionEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
