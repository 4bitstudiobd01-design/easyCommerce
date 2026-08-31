import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillEntity } from '../entities/bill.entity';

export interface BillStatDelta {
  value: string;
  /** Month-over-month percentage change, fixed(2). '0.00' when the prior month was zero. */
  momPct: string;
}

export interface BillStats {
  totalPurchases: BillStatDelta;
  totalItemsReceived: BillStatDelta;
  totalPaid: BillStatDelta;
  outstandingDue: BillStatDelta;
}

function monthBounds(year: number, month: number): { from: string; to: string } {
  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(year, month + 1, 0));
  return {
    from: first.toISOString().slice(0, 10),
    to: last.toISOString().slice(0, 10),
  };
}

function pctChange(current: number, prior: number): string {
  if (prior === 0) return '0.00';
  return (((current - prior) / prior) * 100).toFixed(2);
}

/**
 * KPI figures for the Purchase → Purchases page, each with a month-over-month delta.
 * `outstandingDue` is a running figure (no month scoping); its delta compares the current
 * month's added dues to the prior month's.
 */
@Injectable()
export class GetBillStatsService {
  constructor(
    @InjectRepository(BillEntity)
    private readonly billRepository: Repository<BillEntity>,
  ) {}

  private async monthAggregate(
    storeId: string,
    from: string,
    to: string,
  ): Promise<{ total: number; items: number; paid: number; due: number }> {
    const row = await this.billRepository
      .createQueryBuilder('bill')
      .select('COALESCE(SUM(bill.totalAmount), 0)', 'total')
      .addSelect('COALESCE(SUM(bill.itemsCount), 0)', 'items')
      .addSelect('COALESCE(SUM(bill.paidAmount), 0)', 'paid')
      .addSelect('COALESCE(SUM(bill.totalAmount - bill.paidAmount), 0)', 'due')
      .where('bill.storeId = :storeId', { storeId })
      .andWhere("bill.status != 'CANCELLED'")
      .andWhere('bill.billDate >= :from', { from })
      .andWhere('bill.billDate <= :to', { to })
      .getRawOne<{ total: string; items: string; paid: string; due: string }>();
    return {
      total: Number(row?.total ?? 0),
      items: Number(row?.items ?? 0),
      paid: Number(row?.paid ?? 0),
      due: Number(row?.due ?? 0),
    };
  }

  async execute(storeId: string): Promise<BillStats> {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const cur = monthBounds(year, month);
    const prev = monthBounds(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1);

    const [current, prior, runningDueRow] = await Promise.all([
      this.monthAggregate(storeId, cur.from, cur.to),
      this.monthAggregate(storeId, prev.from, prev.to),
      this.billRepository
        .createQueryBuilder('bill')
        .select('COALESCE(SUM(bill.totalAmount - bill.paidAmount), 0)', 'total')
        .where('bill.storeId = :storeId', { storeId })
        .andWhere("bill.status != 'CANCELLED'")
        .getRawOne<{ total: string }>(),
    ]);

    return {
      totalPurchases: {
        value: current.total.toFixed(2),
        momPct: pctChange(current.total, prior.total),
      },
      totalItemsReceived: {
        value: current.items.toFixed(2),
        momPct: pctChange(current.items, prior.items),
      },
      totalPaid: {
        value: current.paid.toFixed(2),
        momPct: pctChange(current.paid, prior.paid),
      },
      outstandingDue: {
        value: Number(runningDueRow?.total ?? 0).toFixed(2),
        momPct: pctChange(current.due, prior.due),
      },
    };
  }
}
