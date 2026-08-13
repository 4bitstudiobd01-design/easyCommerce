import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export interface SegmentRuleCondition {
  field: 'ordersCount' | 'totalSpent' | 'status' | 'source' | 'daysSinceLastOrder';
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
  value: any;
}

export interface SegmentRuleGroup {
  matchType: 'ALL' | 'ANY';
  conditions: SegmentRuleCondition[];
}

@Entity('customer_segments')
@Index(['tenantId'])
@Index(['tenantId', 'isActive'])
export class CustomerSegmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  tenantId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  storeId?: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb' })
  rules: SegmentRuleGroup;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
