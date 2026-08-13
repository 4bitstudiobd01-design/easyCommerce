import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AttributeDefinitionEntity } from './attribute-definition.entity';

@Entity('attribute_options')
@Index('IDX_attribute_options_attr', ['attributeId'])
export class AttributeOptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  label: string;

  @Column({ type: 'varchar', length: 255 })
  value: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'uuid' })
  attributeId: string;

  @ManyToOne(() => AttributeDefinitionEntity, (attr) => attr.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attributeId' })
  attribute: AttributeDefinitionEntity;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
