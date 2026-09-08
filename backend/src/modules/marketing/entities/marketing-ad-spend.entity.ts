import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Which traffic-source breakdown a spend amount is attributed to. Mirrors the
 * `groupBy` dimension of GetTrafficSourcesService so a spend row can be joined
 * to the matching grouped traffic row for ROAS / CPA.
 */
export enum AdSpendDimensionEnum {
  CHANNEL = 'CHANNEL',
  SOURCE = 'SOURCE',
  CAMPAIGN = 'CAMPAIGN',
}

/**
 * Merchant-entered advertising spend — the denominator for ROAS and CPA in the
 * Sales-by-Source report (Phase A). This is manual entry; auto-importing spend
 * from Meta / Google Ads APIs is out of scope for now.
 *
 * The report joins a grouped traffic-source row to any row here with the same
 * `dimension` + `dimensionValue` whose [periodStart, periodEnd] overlaps the
 * report window.
 */
@Entity('marketing_ad_spends')
@Index(['tenantId', 'storeId'])
@Index(['tenantId', 'storeId', 'dimension', 'periodStart'])
export class MarketingAdSpend {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index()
  storeId: string;

  @Column({ type: 'enum', enum: AdSpendDimensionEnum })
  dimension: AdSpendDimensionEnum;

  /** The concrete grouped value, e.g. `social`, `facebook`, `eid-2026`. */
  @Column({ type: 'varchar', length: 255 })
  dimensionValue: string;

  @Column({ type: 'date' })
  periodStart: string;

  @Column({ type: 'date' })
  periodEnd: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', length: 3, default: 'BDT' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
