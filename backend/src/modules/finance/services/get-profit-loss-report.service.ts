import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { FinanceReportQueryDto } from '../dto/finance-query.dto';
import {
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
} from '../enums/finance.enums';

export function resolveDateRange(dto: FinanceReportQueryDto): { startDate: string; endDate: string } {
  if (dto.startDate && dto.endDate) {
    return { startDate: dto.startDate, endDate: dto.endDate };
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (dto.period === 'last_month') {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const start = new Date(prevYear, prevMonth, 1);
    const end = new Date(prevYear, prevMonth + 1, 0);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }

  if (dto.period === 'this_quarter') {
    const quarter = Math.floor(month / 3);
    const start = new Date(year, quarter * 3, 1);
    const end = new Date(year, (quarter + 1) * 3, 0);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }

  if (dto.period === 'this_year') {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }

  // Default: this_month
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

@Injectable()
export class GetProfitLossReportService {
  constructor(
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
  ) {}

  async execute(storeId: string, query: FinanceReportQueryDto) {
    const { startDate, endDate } = resolveDateRange(query);

    const transactions = await this.transactionRepository
      .createQueryBuilder('txn')
      .where('txn.storeId = :storeId', { storeId })
      .andWhere('txn.status = :status', { status: FinanceTransactionStatusEnum.COMPLETED })
      .andWhere('txn.transactionDate >= :startDate', { startDate })
      .andWhere('txn.transactionDate <= :endDate', { endDate })
      .getMany();

    const revenueBreakdown = {
      productSales: 0,
      shippingIncome: 0,
      otherIncome: 0,
      totalRevenue: 0,
    };

    let cogs = 0;

    const operatingExpenses = {
      marketing: 0,
      salary: 0,
      employeeExpenses: 0,
      rent: 0,
      utilities: 0,
      software: 0,
      shipping: 0,
      other: 0,
      totalOperatingExpenses: 0,
    };

    for (const t of transactions) {
      const amt = Number(t.amount || 0);

      if (t.type === FinanceTransactionTypeEnum.INCOME || t.type === FinanceTransactionTypeEnum.PAYMENT) {
        if (t.categoryCode === 'PRODUCT_SALES') {
          revenueBreakdown.productSales += amt;
        } else if (t.categoryCode === 'SHIPPING_INCOME') {
          revenueBreakdown.shippingIncome += amt;
        } else {
          revenueBreakdown.otherIncome += amt;
        }
        revenueBreakdown.totalRevenue += amt;
      } else if (t.type === FinanceTransactionTypeEnum.EXPENSE || t.type === FinanceTransactionTypeEnum.REFUND) {
        if (t.categoryCode === 'COGS') {
          cogs += amt;
        } else if (t.categoryCode === 'MARKETING') {
          operatingExpenses.marketing += amt;
          operatingExpenses.totalOperatingExpenses += amt;
        } else if (t.categoryCode === 'SALARY') {
          operatingExpenses.salary += amt;
          operatingExpenses.totalOperatingExpenses += amt;
        } else if (t.categoryCode === 'EMPLOYEE_EXPENSE') {
          operatingExpenses.employeeExpenses += amt;
          operatingExpenses.totalOperatingExpenses += amt;
        } else if (t.categoryCode === 'RENT') {
          operatingExpenses.rent += amt;
          operatingExpenses.totalOperatingExpenses += amt;
        } else if (t.categoryCode === 'UTILITIES') {
          operatingExpenses.utilities += amt;
          operatingExpenses.totalOperatingExpenses += amt;
        } else if (t.categoryCode === 'SOFTWARE') {
          operatingExpenses.software += amt;
          operatingExpenses.totalOperatingExpenses += amt;
        } else if (t.categoryCode === 'SHIPPING') {
          operatingExpenses.shipping += amt;
          operatingExpenses.totalOperatingExpenses += amt;
        } else {
          operatingExpenses.other += amt;
          operatingExpenses.totalOperatingExpenses += amt;
        }
      }
    }

    const grossProfit = revenueBreakdown.totalRevenue - cogs;
    const grossMarginPercent =
      revenueBreakdown.totalRevenue > 0
        ? (grossProfit / revenueBreakdown.totalRevenue) * 100
        : 0;

    const netProfit = grossProfit - operatingExpenses.totalOperatingExpenses;
    const netMarginPercent =
      revenueBreakdown.totalRevenue > 0
        ? (netProfit / revenueBreakdown.totalRevenue) * 100
        : 0;

    return {
      dateRange: { startDate, endDate },
      revenue: revenueBreakdown,
      cogs,
      grossProfit,
      grossMarginPercent,
      operatingExpenses,
      netProfit,
      netMarginPercent,
      currency: 'BDT',
    };
  }
}
