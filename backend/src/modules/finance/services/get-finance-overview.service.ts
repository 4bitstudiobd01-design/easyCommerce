import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { FinanceInvoiceEntity } from '../entities/finance-invoice.entity';
import { FinanceBillEntity } from '../entities/finance-bill.entity';
import {
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceInvoiceStatusEnum,
  FinanceBillStatusEnum,
} from '../enums/finance.enums';

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
  ) {}

  async execute(storeId: string) {
    // 1. Total Incomes & Total Expenses from Transactions
    const completedTransactions = await this.transactionRepository.find({
      where: { storeId, status: FinanceTransactionStatusEnum.COMPLETED },
    });

    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const t of completedTransactions) {
      const amt = Number(t.amount || 0);
      if (t.type === FinanceTransactionTypeEnum.INCOME) {
        totalRevenue += amt;
      } else if (t.type === FinanceTransactionTypeEnum.EXPENSE) {
        totalExpenses += amt;
      }
    }

    const netProfit = totalRevenue - totalExpenses;

    // 2. Receivables from Invoices (UNPAID, PARTIALLY_PAID, OVERDUE)
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

    // 3. Payables from Bills (UNPAID, PARTIALLY_PAID, OVERDUE)
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

    // 4. Accounts & Total Cash/Bank Balances
    const accounts = await this.accountRepository.find({
      where: { storeId, isActive: true },
      order: { isDefault: 'DESC', name: 'ASC' },
    });

    const totalAccountBalance = accounts.reduce(
      (sum, acc) => sum + Number(acc.currentBalance || 0),
      0,
    );

    // 5. Recent 10 Transactions
    const recentTransactions = await this.transactionRepository.find({
      where: { storeId },
      relations: ['account', 'category'],
      order: { transactionDate: 'DESC', createdAt: 'DESC' },
      take: 10,
    });

    // 6. Monthly Revenue vs Expense Trend (Last 6 Months)
    const monthlyTrendMap: Record<string, { month: string; revenue: number; expense: number; profit: number }> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      monthlyTrendMap[key] = { month: monthLabel, revenue: 0, expense: 0, profit: 0 };
    }

    for (const t of completedTransactions) {
      if (!t.transactionDate) continue;
      const key = t.transactionDate.substring(0, 7); // YYYY-MM
      if (monthlyTrendMap[key]) {
        const amt = Number(t.amount || 0);
        if (t.type === FinanceTransactionTypeEnum.INCOME) {
          monthlyTrendMap[key].revenue += amt;
        } else if (t.type === FinanceTransactionTypeEnum.EXPENSE) {
          monthlyTrendMap[key].expense += amt;
        }
        monthlyTrendMap[key].profit =
          monthlyTrendMap[key].revenue - monthlyTrendMap[key].expense;
      }
    }

    const revenueVsExpenseTrend = Object.values(monthlyTrendMap);

    return {
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        totalReceivables,
        totalPayables,
        totalAccountBalance,
        currency: 'BDT',
      },
      accounts,
      recentTransactions,
      revenueVsExpenseTrend,
    };
  }
}
