import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MarketingEventNameEnum {
  PageView = 'PageView',
  ViewContent = 'ViewContent',
  AddToCart = 'AddToCart',
  InitiateCheckout = 'InitiateCheckout',
  Purchase = 'Purchase',
}

@Entity('marketing_event_configs')
@Index(['tenantId', 'storeId'])
export class MarketingEventConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index()
  storeId: string;

  @Column({
    type: 'enum',
    enum: MarketingEventNameEnum,
  })
  eventName: MarketingEventNameEnum;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
