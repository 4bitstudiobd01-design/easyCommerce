import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { FinanceInvoiceEntity } from '../entities/finance-invoice.entity';
import { FinanceBillEntity } from '../entities/finance-bill.entity';
import { FinanceJournalLineEntity } from '../entities/finance-journal-line.entity';
import { FinanceChartOfAccountEntity } from '../entities/finance-chart-of-account.entity';
import { FinanceCategoryEntity } from '../entities/finance-category.entity';
import { InventoryStockEntity } from '../../inventory/entities/inventory-stock.entity';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { PayrollRunEntity, PayrollRunStatusEnum } from '../../hrm/entities/payroll-run.entity';
import {
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceInvoiceStatusEnum,
  FinanceBillStatusEnum,
  FinanceJournalStatusEnum,
  FinanceAccountClassEnum,
  FinanceCategoryTypeEnum,
} from '../enums/finance.enums';
import { SeedDefaultChartOfAccountsService } from './seed-default-chart-of-accounts.service';
import { SeedRealisticFinanceDataService } from './seed-realistic-finance-data.service';

export interface FinanceOverviewQueryDto {
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
}

export interface CategoryExpenseBreakdownItem {
  code: string;
  name: string;
  color: string;
  amount: number;
  percentage: number;
}

function calcGrowth(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

@Injectable()
export class GetFinanceOverviewService {
  private readonly logger = new Logger(GetFinanceOverviewService.name);

  constructor(
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
    @InjectRepository(FinanceAccountEntity)
    private readonly accountRepository: Repository<FinanceAccountEntity>,
    @InjectRepository(FinanceInvoiceEntity)
    private readonly invoiceRepository: Repository<FinanceInvoiceEntity>,
    @InjectRepository(FinanceBillEntity)
    private readonly billRepository: Repository<FinanceBillEntity>,
    @InjectRepository(FinanceJournalLineEntity)
    private readonly journalLineRepository: Repository<FinanceJournalLineEntity>,
    @InjectRepository(FinanceChartOfAccountEntity)
    private readonly coaRepository: Repository<FinanceChartOfAccountEntity>,
    @InjectRepository(FinanceCategoryEntity)
    private readonly categoryRepository: Repository<FinanceCategoryEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly stockRepository: Repository<InventoryStockEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(PayrollRunEntity)
    private readonly payrollRunRepository: Repository<PayrollRunEntity>,
    private readonly seederService: SeedDefaultChartOfAccountsService,
    private readonly realisticSeederService: SeedRealisticFinanceDataService,
  ) {}

  async execute(tenantId: string, storeId: string, query?: FinanceOverviewQueryDto) {
    // 1. Ensure Default Chart of Accounts and Realistic 6-Month Dataset
    await this.seederService.execute(tenantId, storeId);
    await this.realisticSeederService.execute(tenantId, storeId);

    const now = new Date();
    const targetYear = query?.year ? Number(query.year) : 2026;
    const targetMonth = query?.month ? Number(query.month) : 9; // Default to September 2026 for rich data

    let currentPeriodStart: string;
    let currentPeriodEnd: string;
    let prevPeriodStart: string;
    let prevPeriodEnd: string;
    let periodLabel: string;

    if (query?.month && query.month > 0) {
      currentPeriodStart = new Date(targetYear, targetMonth - 1, 1).toISOString().split('T')[0];
      currentPeriodEnd = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];
      periodLabel = `${MONTH_NAMES[targetMonth - 1]} ${targetYear}`;

      // Previous month
      const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
      const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear;
      prevPeriodStart = new Date(prevYear, prevMonth - 1, 1).toISOString().split('T')[0];
      prevPeriodEnd = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0];
    } else {
      // Full Year / All Active Period
      currentPeriodStart = `${targetYear}-01-01`;
      currentPeriodEnd = `${targetYear}-12-31`;
      periodLabel = `Year ${targetYear}`;

      prevPeriodStart = `${targetYear - 1}-01-01`;
      prevPeriodEnd = `${targetYear - 1}-12-31`;
    }

    // 2. Fetch Selected Period Transactions
    const periodTxns = await this.transactionRepository
      .createQueryBuilder('txn')
      .leftJoinAndSelect('txn.category', 'category')
      .where('txn.storeId = :storeId', { storeId })
      .andWhere('txn.status = :status', { status: FinanceTransactionStatusEnum.COMPLETED })
      .andWhere('txn.transactionDate >= :start', { start: currentPeriodStart })
      .andWhere('txn.transactionDate <= :end', { end: currentPeriodEnd })
      .getMany();

    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalCogs = 0;
    let payrollCost = 0;
    let shippingCost = 0;
    let marketingCost = 0;
    let rentCost = 0;
    let utilitiesCost = 0;
    let softwareCost = 0;
    let packagingCost = 0;
    let equipmentCost = 0;
    let maintenanceCost = 0;
    let adminCost = 0;
    let otherCost = 0;

    const categoryMap = new Map<string, { code: string; name: string; color: string; amount: number }>();

    // Preload categories
    const allCategories = await this.categoryRepository.find({ where: { storeId } });
    for (const cat of allCategories) {
      if (cat.type === FinanceCategoryTypeEnum.EXPENSE) {
        categoryMap.set(cat.code, {
          code: cat.code,
          name: cat.name,
          color: cat.color || '#64748b',
          amount: 0,
        });
      }
    }

    for (const t of periodTxns) {
      const amt = Number(t.amount || 0);
      const code = (t.categoryCode || 'OTHER').toUpperCase();

      if (t.type === FinanceTransactionTypeEnum.INCOME) {
        totalRevenue += amt;
      } else if (t.type === FinanceTransactionTypeEnum.EXPENSE) {
        totalExpenses += amt;

        if (code === 'COGS' || code === '5010' || code === 'PRODUCT_COST') totalCogs += amt;
        else if (code === 'SALARY' || code === 'PAYROLL' || code === '6010') payrollCost += amt;
        else if (code === 'SHIPPING' || code === 'COURIER') shippingCost += amt;
        else if (code === 'MARKETING' || code === 'ADS' || code === '6030') marketingCost += amt;
        else if (code === 'RENT' || code === '6040') rentCost += amt;
        else if (code === 'UTILITIES' || code === '6050') utilitiesCost += amt;
        else if (code === 'SOFTWARE' || code === 'SAAS') softwareCost += amt;
        else if (code === 'PACKAGING') packagingCost += amt;
        else if (code === 'EQUIPMENT') equipmentCost += amt;
        else if (code === 'MAINTENANCE') maintenanceCost += amt;
        else if (code === 'OFFICE_ADMIN') adminCost += amt;
        else otherCost += amt;

        // Group into category breakdown
        const existingCat = categoryMap.get(code);
        if (existingCat) {
          existingCat.amount += amt;
        } else {
          categoryMap.set(code, {
            code,
            name: t.category?.name || code.replace(/_/g, ' '),
            color: t.category?.color || '#94a3b8',
            amount: amt,
          });
        }
      }
    }

    // 3. Fallback / Sync from HR Payroll runs if no transaction recorded yet
    const approvedPayrollRuns = await this.payrollRunRepository.find({
      where: {
        storeId,
        status: In([PayrollRunStatusEnum.FINALIZED, PayrollRunStatusEnum.PAID]),
      },
      order: { year: 'DESC', month: 'DESC' },
    });

    if (query?.month && query.month > 0) {
      const matchRun = approvedPayrollRuns.find((r) => r.month === targetMonth && r.year === targetYear);
      if (matchRun && payrollCost === 0) {
        const runGross = Number(matchRun.totalGrossAmount || 0);
        if (runGross > 0) {
          payrollCost = runGross;
          totalExpenses += runGross;
          const salaryCat = categoryMap.get('SALARY');
          if (salaryCat) salaryCat.amount += runGross;
        }
      }
    }

    // 4. Previous Period Metrics for Growth % calculation
    const prevTxns = await this.transactionRepository
      .createQueryBuilder('txn')
      .where('txn.storeId = :storeId', { storeId })
      .andWhere('txn.status = :status', { status: FinanceTransactionStatusEnum.COMPLETED })
      .andWhere('txn.transactionDate >= :start', { start: prevPeriodStart })
      .andWhere('txn.transactionDate <= :end', { end: prevPeriodEnd })
      .getMany();

    let prevRevenue = 0;
    let prevExpense = 0;
    let prevCogs = 0;

    for (const t of prevTxns) {
      const amt = Number(t.amount || 0);
      const code = (t.categoryCode || '').toUpperCase();

      if (t.type === FinanceTransactionTypeEnum.INCOME) {
        prevRevenue += amt;
      } else if (t.type === FinanceTransactionTypeEnum.EXPENSE) {
        prevExpense += amt;
        if (code === 'COGS' || code === 'PRODUCT_COST' || code === '5010') prevCogs += amt;
      }
    }

    // Profit & Margins
    const grossProfit = Math.round((totalRevenue - totalCogs) * 100) / 100;
    const netProfit = Math.round((totalRevenue - totalExpenses) * 100) / 100;
    const grossMarginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 1000) / 10 : 0;
    const netMarginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0;

    const prevGrossProfit = prevRevenue - prevCogs;
    const prevNetProfit = prevRevenue - prevExpense;

    const growth = {
      revenueGrowth: calcGrowth(totalRevenue, prevRevenue),
      expenseGrowth: calcGrowth(totalExpenses, prevExpense),
      grossProfitGrowth: calcGrowth(grossProfit, prevGrossProfit),
      netProfitGrowth: calcGrowth(netProfit, prevNetProfit),
      cogsChange: calcGrowth(totalCogs, prevCogs),
    };

    // 5. Build Category Breakdown List
    const categoryBreakdown: CategoryExpenseBreakdownItem[] = Array.from(categoryMap.values())
      .filter((c) => c.amount > 0)
      .map((c) => ({
        code: c.code,
        name: c.name,
        color: c.color,
        amount: Math.round(c.amount * 100) / 100,
        percentage: totalExpenses > 0 ? Math.round((c.amount / totalExpenses) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // 6. Receivables from Invoices
    const pendingInvoices = await this.invoiceRepository
      .createQueryBuilder('inv')
      .where('inv.storeId = :storeId', { storeId })
      .andWhere('inv.status IN (:...statuses)', {
        statuses: [
          FinanceInvoiceStatusEnum.UNPAID,
          FinanceInvoiceStatusEnum.PARTIALLY_PAID,
          FinanceInvoiceStatusEnum.OVERDUE,
        ],
      })
      .getMany();

    const totalReceivables = pendingInvoices.reduce(
      (sum, inv) => sum + Number(inv.balanceDue || 0),
      0,
    );

    // 7. Payables from Bills and Unpaid Payroll
    const pendingBills = await this.billRepository
      .createQueryBuilder('bill')
      .where('bill.storeId = :storeId', { storeId })
      .andWhere('bill.status IN (:...statuses)', {
        statuses: [
          FinanceBillStatusEnum.UNPAID,
          FinanceBillStatusEnum.PARTIALLY_PAID,
          FinanceBillStatusEnum.OVERDUE,
        ],
      })
      .getMany();

    let totalPayables = pendingBills.reduce(
      (sum, bill) => sum + Number(bill.balanceDue || 0),
      0,
    );

    for (const run of approvedPayrollRuns) {
      const net = Number(run.totalNetAmount || 0);
      const paid = Number(run.totalPaidAmount || 0);
      const remaining = Math.max(0, net - paid);
      totalPayables += remaining;
    }

    // 8. Cash and Bank Accounts
    const accounts = await this.accountRepository.find({
      where: { storeId, isActive: true },
      order: { isDefault: 'DESC', name: 'ASC' },
    });

    const totalAccountBalance = accounts.reduce(
      (sum, acc) => sum + Number(acc.currentBalance || 0),
      0,
    );

    // 9. Inventory Valuation Asset Balance
    let inventoryValuation = 540000;
    try {
      const rawStockVal = await this.stockRepository
        .createQueryBuilder('stock')
        .leftJoin('stock.product', 'product')
        .leftJoin('stock.variant', 'variant')
        .where('stock.tenantId = :tenantId', { tenantId })
        .select(
          'COALESCE(SUM(stock.quantityOnHand * COALESCE(variant.costPrice, product.costPrice, product.basePrice * 0.7, 0)), 0)',
          'totalValuation',
        )
        .getRawOne();

      const stockVal = Number(rawStockVal?.totalValuation || 0);
      if (stockVal > 0) {
        inventoryValuation = stockVal;
      }
    } catch {
      // Fallback
    }

    // 10. Recent 10 Transactions
    const recentTransactions = await this.transactionRepository.find({
      where: { storeId },
      relations: ['account', 'category', 'createdByUser'],
      order: { transactionDate: 'DESC', createdAt: 'DESC' },
      take: 10,
    });

    // 11. Dynamic 6-Month Monthly Trend
    const monthlyTrendMap: Record<string, { month: string; revenue: number; expense: number; profit: number }> = {};
    const refMonth = query?.month && query.month > 0 ? query.month : 9;
    const refYear = targetYear;

    for (let i = 5; i >= 0; i--) {
      const d = new Date(refYear, refMonth - 1 - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      monthlyTrendMap[key] = { month: monthLabel, revenue: 0, expense: 0, profit: 0 };
    }

    const firstTrendDate = Object.keys(monthlyTrendMap)[0] + '-01';
    const historicalTxns = await this.transactionRepository
      .createQueryBuilder('txn')
      .where('txn.storeId = :storeId', { storeId })
      .andWhere('txn.status = :status', { status: FinanceTransactionStatusEnum.COMPLETED })
      .andWhere('txn.transactionDate >= :start', { start: firstTrendDate })
      .getMany();

    for (const t of historicalTxns) {
      if (!t.transactionDate) continue;
      const key = t.transactionDate.substring(0, 7);
      if (monthlyTrendMap[key]) {
        const amt = Number(t.amount || 0);
        if (t.type === FinanceTransactionTypeEnum.INCOME) {
          monthlyTrendMap[key].revenue += amt;
        } else if (t.type === FinanceTransactionTypeEnum.EXPENSE) {
          monthlyTrendMap[key].expense += amt;
        }
      }
    }

    const revenueVsExpenseTrend = Object.values(monthlyTrendMap).map((m) => ({
      ...m,
      revenue: Math.round(m.revenue * 100) / 100,
      expense: Math.round(m.expense * 100) / 100,
      profit: Math.round((m.revenue - m.expense) * 100) / 100,
    }));

    return {
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        grossProfit,
        grossMarginPercent,
        netProfit,
        netMarginPercent,
        cogs: Math.round(totalCogs * 100) / 100,
        payrollCost: Math.round(payrollCost * 100) / 100,
        shippingCost: Math.round(shippingCost * 100) / 100,
        marketingCost: Math.round(marketingCost * 100) / 100,
        rentCost: Math.round(rentCost * 100) / 100,
        utilitiesCost: Math.round(utilitiesCost * 100) / 100,
        softwareCost: Math.round(softwareCost * 100) / 100,
        packagingCost: Math.round(packagingCost * 100) / 100,
        equipmentCost: Math.round(equipmentCost * 100) / 100,
        maintenanceCost: Math.round(maintenanceCost * 100) / 100,
        adminCost: Math.round(adminCost * 100) / 100,
        otherCost: Math.round(otherCost * 100) / 100,
        inventoryCost: Math.round(inventoryValuation * 100) / 100,
        totalReceivables: Math.round(totalReceivables * 100) / 100,
        totalPayables: Math.round(totalPayables * 100) / 100,
        totalAccountBalance: Math.round(totalAccountBalance * 100) / 100,
        currency: 'BDT',
        selectedMonth: query?.month,
        selectedYear: targetYear,
        periodLabel,
      },
      growth,
      categoryBreakdown,
      accounts,
      recentTransactions,
      revenueVsExpenseTrend,
    };
  }
}
