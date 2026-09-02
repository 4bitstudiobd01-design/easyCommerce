import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillEntity, BillPaymentStatusEnum } from '../entities/bill.entity';
import {
  PurchaseOrderEntity,
  PurchaseOrderStatusEnum,
} from '../entities/purchase-order.entity';
import { PurchaseOverviewQueryDto } from '../dto/overview.dto';

export interface PurchaseOverviewKpiDelta {
  value: string;
  momPct: string;
}

export interface PurchaseOverview {
  period: { from: string; to: string };
  kpis: {
    totalPurchases: PurchaseOverviewKpiDelta;
    receivedPurchases: PurchaseOverviewKpiDelta;
    pendingPurchaseOrders: { value: number; momPct: string };
    outstandingSupplierDue: PurchaseOverviewKpiDelta;
  };
  monthlyTrend: Array<{ month: string; amount: string; count: number }>;
  poStatusBreakdown: Array<{
    status: PurchaseOrderStatusEnum;
    count: number;
    pct: string;
  }>;
  recentPurchases: Array<{
    id: string;
    purchaseNo: string;
    supplier: string;
    date: string;
    items: number;
    total: string;
    paid: string;
    due: string;
    status: BillPaymentStatusEnum;
  }>;
  topSuppliers: Array<{ id: string; name: string; totalPurchase: string; due: string }>;
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function pctChange(current: number, prior: number): string {
  if (prior === 0) return '0.00';
  return (((current - prior) / prior) * 100).toFixed(2);
}

/**
 * Aggregate figures, trend and lists for the Purchase → Overview page.
 */
@Injectable()
export class GetPurchaseOverviewService {
  constructor(
    @InjectRepository(BillEntity)
    private readonly billRepository: Repository<BillEntity>,
    @InjectRepository(PurchaseOrderEntity)
    private readonly purchaseOrderRepository: Repository<PurchaseOrderEntity>,
  ) {}

  async execute(
    storeId: string,
    _query: PurchaseOverviewQueryDto,
  ): Promise<PurchaseOverview> {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const curFrom = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
    const curTo = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10);
    const prevFrom = new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 10);
    const prevTo = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);

    const monthAgg = async (from: string, to: string) => {
      const row = await this.billRepository
        .createQueryBuilder('bill')
        .select('COALESCE(SUM(bill.totalAmount), 0)', 'total')
        .addSelect('COALESCE(SUM(bill.paidAmount), 0)', 'paid')
        .where('bill.storeId = :storeId', { storeId })
        .andWhere("bill.status != 'CANCELLED'")
        .andWhere('bill.billDate >= :from', { from })
        .andWhere('bill.billDate <= :to', { to })
        .getRawOne<{ total: string; paid: string }>();
      return { total: Number(row?.total ?? 0), paid: Number(row?.paid ?? 0) };
    };

    const [current, prior] = await Promise.all([
      monthAgg(curFrom, curTo),
      monthAgg(prevFrom, prevTo),
    ]);

    const [outstandingRow, pendingCurrent, pendingPrior] = await Promise.all([
      this.billRepository
        .createQueryBuilder('bill')
        .select('COALESCE(SUM(bill.totalAmount - bill.paidAmount), 0)', 'total')
        .where('bill.storeId = :storeId', { storeId })
        .andWhere("bill.status != 'CANCELLED'")
        .getRawOne<{ total: string }>(),
      this.purchaseOrderRepository.count({
        where: [
          { storeId, status: PurchaseOrderStatusEnum.SENT },
          { storeId, status: PurchaseOrderStatusEnum.PARTIALLY_RECEIVED },
        ],
      }),
      this.purchaseOrderRepository
        .createQueryBuilder('po')
        .where('po.storeId = :storeId', { storeId })
        .andWhere('po.status IN (:...statuses)', {
          statuses: [
            PurchaseOrderStatusEnum.SENT,
            PurchaseOrderStatusEnum.PARTIALLY_RECEIVED,
          ],
        })
        .andWhere('po.orderDate >= :from', { from: prevFrom })
        .andWhere('po.orderDate <= :to', { to: prevTo })
        .getCount(),
    ]);

    // Monthly trend — last 12 months, gap-filled.
    const trendStart = new Date(Date.UTC(year, month - 11, 1)).toISOString().slice(0, 10);
    const trendRows = await this.billRepository
      .createQueryBuilder('bill')
      .select("to_char(bill.billDate, 'YYYY-MM')", 'month')
      .addSelect('COALESCE(SUM(bill.totalAmount), 0)', 'amount')
      .addSelect('COUNT(*)', 'count')
      .where('bill.storeId = :storeId', { storeId })
      .andWhere("bill.status != 'CANCELLED'")
      .andWhere('bill.billDate >= :from', { from: trendStart })
      .groupBy("to_char(bill.billDate, 'YYYY-MM')")
      .getRawMany<{ month: string; amount: string; count: string }>();
    const trendMap = new Map(
      trendRows.map((r) => [r.month, { amount: Number(r.amount), count: Number(r.count) }]),
    );
    const monthlyTrend: PurchaseOverview['monthlyTrend'] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(year, month - i, 1));
      const key = monthKey(d);
      const hit = trendMap.get(key);
      monthlyTrend.push({
        month: key,
        amount: (hit?.amount ?? 0).toFixed(2),
        count: hit?.count ?? 0,
      });
    }

    // PO status breakdown.
    const statusRows = await this.purchaseOrderRepository
      .createQueryBuilder('po')
      .select('po.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('po.storeId = :storeId', { storeId })
      .groupBy('po.status')
      .getRawMany<{ status: PurchaseOrderStatusEnum; count: string }>();
    const statusTotal = statusRows.reduce((sum, r) => sum + Number(r.count), 0);
    const poStatusBreakdown: PurchaseOverview['poStatusBreakdown'] = statusRows.map((r) => ({
      status: r.status,
      count: Number(r.count),
      pct: statusTotal > 0 ? ((Number(r.count) / statusTotal) * 100).toFixed(2) : '0.00',
    }));

    // Recent purchases.
    const recentBills = await this.billRepository.find({
      where: { storeId },
      order: { billDate: 'DESC', createdAt: 'DESC' },
      take: 5,
    });
    const recentPurchases: PurchaseOverview['recentPurchases'] = recentBills.map((bill) => ({
      id: bill.id,
      purchaseNo: bill.billNumber,
      supplier: bill.supplierName,
      date: bill.billDate,
      items: bill.itemsCount,
      total: Number(bill.totalAmount).toFixed(2),
      paid: Number(bill.paidAmount).toFixed(2),
      due: (Number(bill.totalAmount) - Number(bill.paidAmount)).toFixed(2),
      status: bill.paymentStatus,
    }));

    // Top suppliers by total purchases.
    const topRows = await this.billRepository
      .createQueryBuilder('bill')
      .select('bill.supplierId', 'supplierId')
      .addSelect('MAX(bill.supplierName)', 'supplierName')
      .addSelect('COALESCE(SUM(bill.totalAmount), 0)', 'totalPurchase')
      .addSelect('COALESCE(SUM(bill.totalAmount - bill.paidAmount), 0)', 'due')
      .where('bill.storeId = :storeId', { storeId })
      .andWhere("bill.status != 'CANCELLED'")
      .groupBy('bill.supplierId')
      .orderBy('"totalPurchase"', 'DESC')
      .limit(5)
      .getRawMany<{
        supplierId: string;
        supplierName: string;
        totalPurchase: string;
        due: string;
      }>();
    const topSuppliers: PurchaseOverview['topSuppliers'] = topRows.map((r) => ({
      id: r.supplierId,
      name: r.supplierName,
      totalPurchase: Number(r.totalPurchase).toFixed(2),
      due: Number(r.due).toFixed(2),
    }));

    return {
      period: { from: curFrom, to: curTo },
      kpis: {
        totalPurchases: {
          value: current.total.toFixed(2),
          momPct: pctChange(current.total, prior.total),
        },
        receivedPurchases: {
          value: current.paid.toFixed(2),
          momPct: pctChange(current.paid, prior.paid),
        },
        pendingPurchaseOrders: {
          value: pendingCurrent,
          momPct: pctChange(pendingCurrent, pendingPrior),
        },
        outstandingSupplierDue: {
          value: Number(outstandingRow?.total ?? 0).toFixed(2),
          momPct: pctChange(current.total - current.paid, prior.total - prior.paid),
        },
      },
      monthlyTrend,
      poStatusBreakdown,
      recentPurchases,
      topSuppliers,
    };
  }
}
