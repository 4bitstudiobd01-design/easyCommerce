import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * A named delivery area with its own shipping rate and ETA. Checkout resolves a
 * customer's city/area against these zones to price delivery; when nothing
 * matches, the store's flat Dhaka/outside-Dhaka fallback still applies.
 */
@Entity('delivery_zones')
@Index(['tenantId', 'storeId'])
export class DeliveryZoneEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  /** Matching city/area names for this zone, lower-cased on write. */
  @Column({ type: 'jsonb', default: [] })
  areas: string[];

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 60 })
  deliveryCharge: number;

  @Column({ type: 'varchar', length: 60, nullable: true })
  estimatedDeliveryTime?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
