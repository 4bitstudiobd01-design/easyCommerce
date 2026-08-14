import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PaymentGatewayEnum } from '../enums/payment-gateway.enum';

export enum PaymentGatewayStatusEnum {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  DISABLED = 'DISABLED',
}

/**
 * A merchant's connection to a payment processor.
 *
 * Credentials are deliberately NOT stored on this entity — secrets live in the
 * store payment settings / environment configuration. This table only records
 * which gateways a tenant has connected and their operational status, so the
 * dashboard can list them without ever touching secret material.
 */
@Entity('payment_gateways')
@Index('IDX_payment_gateways_tenant_code', ['tenantId', 'code'], { unique: true })
export class PaymentGatewayEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: PaymentGatewayEnum })
  code: PaymentGatewayEnum;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  /** Display grouping, e.g. "Mobile Payment", "Card Payment". */
  @Column({ type: 'varchar', length: 50 })
  kind: string;

  @Column({
    type: 'enum',
    enum: PaymentGatewayStatusEnum,
    default: PaymentGatewayStatusEnum.DISCONNECTED,
  })
  status: PaymentGatewayStatusEnum;

  @Column({ type: 'boolean', default: true })
  isEnabled: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
