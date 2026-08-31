import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { FinanceInvoiceEntity } from '../entities/finance-invoice.entity';
import { FinanceBillEntity } from '../entities/finance-bill.entity';
import { FinanceJournalLineEntity } from '../entities/finance-journal-line.entity';
import { FinanceChartOfAccountEntity } from '../entities/finance-chart-of-account.entity';
import { InventoryStockEntity } from '../../inventory/entities/inventory-stock.entity';
import { ProductEntity } from '../../catalog/entities/product.entity';
import {
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceInvoiceStatusEnum,
  FinanceBillStatusEnum,
  FinanceJournalStatusEnum,
  FinanceAccountClassEnum,
} from '../enums/finance.enums';
import { SeedDefaultChartOfAccountsService } from './seed-default-chart-of-accounts.service';

function calcGrowth(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

@Injectable()
export class GetFinanceOverviewService {
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
    @InjectRepository(InventoryStockEntity)
    private readonly stockRepository: Repository<InventoryStockEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly seederService: SeedDefaultChartOfAccountsService,
  ) {}

  async execute(tenantId: string, storeId: string) {
    await this.seederService.execute(tenantId, storeId);

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

    // 1. Current Month Metrics
    const currentTxns = await this.transactionRepository
      .createQueryBuilder('txn')
      .where('txn.storeId = :storeId', { storeId })
      .andWhere('txn.status = :status', { status: FinanceTransactionStatusEnum.COMPLETED })
      .andWhere('txn.transactionDate >= :start', { start: currentMonthStart })
      .andWhere('txn.transactionDate <= :end', { end: currentMonthEnd })
      .getMany();

    let currentRevenue = 0;
    let currentExpense = 0;
    let currentCogs = 0;
    let currentPayroll = 0;
    let currentMarketing = 0;

    for (const t of currentTxns) {
      const amt = Number(t.amount || 0);
      const code = (t.categoryCode || '').toUpperCase();

      if (t.type === FinanceTransactionTypeEnum.INCOME) {
        currentRevenue += amt;
      } else if (t.type === FinanceTransactionTypeEnum.EXPENSE) {
        currentExpense += amt;
        if (code === 'COGS' || code === 'PRODUCT_COST' || code === '5010') currentCogs += amt;
        if (code === 'SALARY' || code === 'PAYROLL' || code === '6010') currentPayroll += amt;
        if (code === 'MARKETING' || code === 'ADS' || code === '6030') currentMarketing += amt;
      }
    }

    // 2. Previous Month Metrics for Growth % calculation
    const prevTxns = await this.transactionRepository
      .createQueryBuilder('txn')
      .where('txn.storeId = :storeId', { storeId })
      .andWhere('txn.status = :status', { status: FinanceTransactionStatusEnum.COMPLETED })
      .andWhere('txn.transactionDate >= :start', { start: prevMonthStart })
      .andWhere('txn.transactionDate <= :end', { end: prevMonthEnd })
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

    // Double Entry Journal check for current month if available
    const currentJournalLines = await this.journalLineRepository
      .createQueryBuilder('jl')
      .innerJoinAndSelect('jl.journalEntry', 'je')
      .innerJoinAndSelect('jl.account', 'acc')
      .where('jl.storeId = :storeId', { storeId })
      .andWhere('je.status = :status', { status: FinanceJournalStatusEnum.POSTED })
      .andWhere('je.entryDate >= :start', { start: currentMonthStart })
      .andWhere('je.entryDate <= :end', { end: currentMonthEnd })
      .getMany();

    if (currentJournalLines.length > 0) {
      let jRev = 0;
      let jExp = 0;
      let jCogs = 0;
      let jPayroll = 0;
      let jMarketing = 0;

      for (const line of currentJournalLines) {
        const amt = Number(line.amount || 0);
        const code = line.accountCode;
        const cls = line.account.accountClass;

        if (cls === FinanceAccountClassEnum.REVENUE) {
          if (code === '4090' || code === '4095') jRev -= amt;
          else jRev += amt;
        } else if (cls === FinanceAccountClassEnum.EXPENSE) {
          jExp += amt;
          if (code.startsWith('50')) jCogs += amt;
          if (code === '6010' || code === '6020') jPayroll += amt;
          if (code === '6030') jMarketing += amt;
        }
      }

      currentRevenue = Math.max(0, jRev);
      currentExpense = jExp;
      currentCogs = jCogs;
      currentPayroll = jPayroll;
      currentMarketing = jMarketing;
    }

    const currentGrossProfit = Math.round((currentRevenue - currentCogs) * 100) / 100;
    const currentNetProfit = Math.round((currentRevenue - currentExpense) * 100) / 100;
    const grossMarginPercent = currentRevenue > 0 ? Math.round((currentGrossProfit / currentRevenue) * 1000) / 10 : 0;
    const netMarginPercent = currentRevenue > 0 ? Math.round((currentNetProfit / currentRevenue) * 1000) / 10 : 0;

    const prevGrossProfit = prevRevenue - prevCogs;
    const prevNetProfit = prevRevenue - prevExpense;

    const growth = {
      revenueGrowth: calcGrowth(currentRevenue, prevRevenue),
      expenseGrowth: calcGrowth(currentExpense, prevExpense),
      grossProfitGrowth: calcGrowth(currentGrossProfit, prevGrossProfit),
      netProfitGrowth: calcGrowth(currentNetProfit, prevNetProfit),
      cogsChange: calcGrowth(currentCogs, prevCogs),
    };

    // 3. Receivables from Invoices
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

    // 4. Payables from Bills
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

    const totalPayables = pendingBills.reduce(
      (sum, bill) => sum + Number(bill.balanceDue || 0),
      0,
    );

    // 5. Cash and Bank Accounts
    const accounts = await this.accountRepository.find({
      where: { storeId, isActive: true },
      order: { isDefault: 'DESC', name: 'ASC' },
    });

    const totalAccountBalance = accounts.reduce(
      (sum, acc) => sum + Number(acc.currentBalance || 0),
      0,
    );

    // 6. Inventory Valuation Asset Balance
    const inventoryAccount = await this.coaRepository.findOne({
      where: { storeId, code: '1300' },
    });
    let inventoryValuation = Number(inventoryAccount?.currentBalance || 0);

    if (inventoryValuation <= 0) {
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
        } else {
          // Fallback to active catalog products
          const rawProdVal = await this.productRepository
            .createQueryBuilder('prod')
            .where('prod.tenantId = :tenantId', { tenantId })
            .select(
              'COALESCE(SUM(COALESCE(prod.costPrice, prod.basePrice * 0.7, 0)), 0)',
              'totalValuation',
            )
            .getRawOne();
          inventoryValuation = Number(rawProdVal?.totalValuation || 0);
        }
      } catch {
        // Fallback silently if tables are being seeded
      }
    }

    // 7. Recent 10 Transactions
    const recentTransactions = await this.transactionRepository.find({
      where: { storeId },
      relations: ['account', 'category'],
      order: { transactionDate: 'DESC', createdAt: 'DESC' },
      take: 10,
    });

    // 8. 6-Month Monthly Trend
    const monthlyTrendMap: Record<string, { month: string; revenue: number; expense: number; profit: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      monthlyTrendMap[key] = { month: monthLabel, revenue: 0, expense: 0, profit: 0 };
    }

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];
    const historicalTxns = await this.transactionRepository
      .createQueryBuilder('txn')
      .where('txn.storeId = :storeId', { storeId })
      .andWhere('txn.status = :status', { status: FinanceTransactionStatusEnum.COMPLETED })
      .andWhere('txn.transactionDate >= :start', { start: sixMonthsAgo })
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
      profit: Math.round((m.revenue - m.expense) * 100) / 100,
    }));

    return {
      summary: {
        totalRevenue: Math.round(currentRevenue * 100) / 100,
        totalExpenses: Math.round(currentExpense * 100) / 100,
        grossProfit: currentGrossProfit,
        grossMarginPercent,
        netProfit: currentNetProfit,
        netMarginPercent,
        cogs: Math.round(currentCogs * 100) / 100,
        payrollCost: Math.round(currentPayroll * 100) / 100,
        marketingCost: Math.round(currentMarketing * 100) / 100,
        inventoryCost: Math.round(inventoryValuation * 100) / 100,
        totalReceivables: Math.round(totalReceivables * 100) / 100,
        totalPayables: Math.round(totalPayables * 100) / 100,
        totalAccountBalance: Math.round(totalAccountBalance * 100) / 100,
        currency: 'BDT',
      },
      growth,
      accounts,
      recentTransactions,
      revenueVsExpenseTrend,
    };
  }
}
