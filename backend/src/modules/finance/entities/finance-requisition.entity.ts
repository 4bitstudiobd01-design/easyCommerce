import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  FinanceRequisitionStatusEnum,
  FinanceRequisitionPriorityEnum,
} from '../enums/finance.enums';

export interface FinanceRequisitionItem {
  productId?: string;
  variantId?: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

@Entity('fin_requisitions')
@Index('IDX_fin_requisitions_tenantId_storeId', ['tenantId', 'storeId'])
@Index('IDX_fin_requisitions_storeId_status', ['storeId', 'status'])
@Index('IDX_fin_requisitions_storeId_reqNumber', ['storeId', 'requisitionNumber'], { unique: true })
export class FinanceRequisitionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_requisitions_tenantId')
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_requisitions_storeId')
  storeId: string;

  @Column({ type: 'varchar', length: 50 })
  requisitionNumber: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 50, default: 'PURCHASE' })
  category: string;

  /** Link to purchase order if originated from a PO */
  @Column({ type: 'uuid', nullable: true })
  @Index('IDX_fin_requisitions_poId')
  purchaseOrderId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  poNumber?: string;

  @Column({ type: 'uuid', nullable: true })
  supplierId?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  supplierName?: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  requestedAmount: string;

  @Column({ type: 'date' })
  requestDate: string;

  @Column({ type: 'date', nullable: true })
  requiredDate?: string;

  @Column({
    type: 'varchar',
    length: 30,
    default: FinanceRequisitionStatusEnum.PENDING,
  })
  status: FinanceRequisitionStatusEnum;

  @Column({
    type: 'varchar',
    length: 30,
    default: FinanceRequisitionPriorityEnum.NORMAL,
  })
  priority: FinanceRequisitionPriorityEnum;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  items: FinanceRequisitionItem[];

  /** Selected account when Finance manager approves and disburses */
  @Column({ type: 'uuid', nullable: true })
  paidFromAccountId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentMethod?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  paymentReference?: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  disbursedAmount?: string;

  @Column({ type: 'uuid', nullable: true })
  financeTransactionId?: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  approvedByUserId?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  approvedByName?: string;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  createdByName?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
