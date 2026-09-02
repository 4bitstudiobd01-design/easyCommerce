import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierEntity, SupplierStatusEnum } from '../entities/supplier.entity';
import { BillEntity } from '../entities/bill.entity';

export interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  /** Σ bill totals dated in the current calendar month, fixed(2). */
  monthPurchases: string;
  /** Σ(totalAmount − paidAmount) over all non-cancelled bills, fixed(2). */
  outstandingDue: string;
  /** Portion of outstandingDue whose bill is past its due date, fixed(2). */
  overdueAmount: string;
}

function monthBounds(now: Date): { from: string; to: string } {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(year, month + 1, 0));
  return {
    from: first.toISOString().slice(0, 10),
    to: last.toISOString().slice(0, 10),
  };
}

/**
 * KPI figures for the Purchase → Suppliers page header.
 */
@Injectable()
export class GetSupplierStatsService {
  constructor(
    @InjectRepository(SupplierEntity)
    private readonly supplierRepository: Repository<SupplierEntity>,
    @InjectRepository(BillEntity)
    private readonly billRepository: Repository<BillEntity>,
  ) {}

  async execute(storeId: string): Promise<SupplierStats> {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const { from, to } = monthBounds(now);

    const [totalSuppliers, activeSuppliers] = await Promise.all([
      this.supplierRepository.count({ where: { storeId } }),
      this.supplierRepository.count({
        where: { storeId, status: SupplierStatusEnum.ACTIVE },
      }),
    ]);

    const monthRow = await this.billRepository
      .createQueryBuilder('bill')
      .select('COALESCE(SUM(bill.totalAmount), 0)', 'total')
      .where('bill.storeId = :storeId', { storeId })
      .andWhere("bill.status != 'CANCELLED'")
      .andWhere('bill.billDate >= :from', { from })
      .andWhere('bill.billDate <= :to', { to })
      .getRawOne<{ total: string }>();

    const dueRow = await this.billRepository
      .createQueryBuilder('bill')
      .select('COALESCE(SUM(bill.totalAmount - bill.paidAmount), 0)', 'total')
      .where('bill.storeId = :storeId', { storeId })
      .andWhere("bill.status != 'CANCELLED'")
      .getRawOne<{ total: string }>();

    const overdueRow = await this.billRepository
      .createQueryBuilder('bill')
      .select('COALESCE(SUM(bill.totalAmount - bill.paidAmount), 0)', 'total')
      .where('bill.storeId = :storeId', { storeId })
      .andWhere("bill.status != 'CANCELLED'")
      .andWhere("bill.paymentStatus != 'PAID'")
      .andWhere('bill.dueDate IS NOT NULL')
      .andWhere('bill.dueDate < :today', { today })
      .getRawOne<{ total: string }>();

    return {
      totalSuppliers,
      activeSuppliers,
      monthPurchases: Number(monthRow?.total ?? 0).toFixed(2),
      outstandingDue: Number(dueRow?.total ?? 0).toFixed(2),
      overdueAmount: Number(overdueRow?.total ?? 0).toFixed(2),
    };
  }
}
