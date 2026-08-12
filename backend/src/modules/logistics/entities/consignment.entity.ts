import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ConsignmentEventEntity } from './consignment-event.entity';

export enum CourierProviderEnum {
  STEADFAST = 'STEADFAST',
  PATHAO = 'PATHAO',
  PAPERFLY = 'PAPERFLY',
}

export enum ConsignmentStatusEnum {
  BOOKED = 'BOOKED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  DELIVERY_FAILED = 'DELIVERY_FAILED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

@Entity('consignments')
export class ConsignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  trackingCode: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'varchar', length: 50 })
  orderNumber: string;

  @Column({ type: 'enum', enum: CourierProviderEnum, default: CourierProviderEnum.STEADFAST })
  courierProvider: CourierProviderEnum;

  @Column({ type: 'varchar', length: 255 })
  recipientName: string;

  @Column({ type: 'varchar', length: 50 })
  recipientPhone: string;

  @Column({ type: 'text' })
  recipientAddress: string;

  @Column({ type: 'varchar', length: 100, default: 'Dhaka' })
  city: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  codAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 60 })
  deliveryCharge: number;

  @Column({ type: 'enum', enum: ConsignmentStatusEnum, default: ConsignmentStatusEnum.BOOKED })
  status: ConsignmentStatusEnum;

  @OneToMany(() => ConsignmentEventEntity, (event) => event.consignment)
  events: ConsignmentEventEntity[];

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
