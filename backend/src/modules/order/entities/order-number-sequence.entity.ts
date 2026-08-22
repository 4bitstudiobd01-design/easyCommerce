import { Entity, PrimaryColumn, Column } from 'typeorm';

/**
 * One row per tenant. `lastValue` is incremented under a `SELECT ... FOR UPDATE`
 * lock so concurrent order creation can never read/increment the same value —
 * unlike a `MAX(...)`-derived scan, this can't collide under concurrency.
 */
@Entity('order_number_sequences')
export class OrderNumberSequenceEntity {
  @PrimaryColumn({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'integer', default: 0 })
  lastValue: number;
}
