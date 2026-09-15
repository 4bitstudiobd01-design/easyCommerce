import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceJournalLineEntity } from '../entities/finance-journal-line.entity';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { QueryFinancialReportDto } from '../dto/financial-reports.dto';
import {
  FinanceAccountClassEnum,
  FinanceLineTypeEnum,
  FinanceJournalStatusEnum,
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
} from '../enums/finance.enums';

import { resolveTimezoneSafeDateRange } from '../utils/finance-date.utils';

export function resolveDateRange(dto: { period?: string; startDate?: string; endDate?: string }): {
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
} {
  return resolveTimezoneSafeDateRange(dto);
}

function calcGrowth(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

@Injectable()
export class GetProfitLossReportService {
  constructor(
    @InjectRepository(FinanceJournalLineEntity)
    private readonly journalLineRepository: Repository<FinanceJournalLineEntity>,
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
  ) {}

  private async calculatePeriodMetrics(storeId: string, startDate: string, endDate: string) {
    // Attempt to calculate from Journal Lines first (double entry)
    const journalLines = await this.journalLineRepository
      .createQueryBuilder('jl')
      .innerJoinAndSelect('jl.journalEntry', 'je')
      .innerJoinAndSelect('jl.account', 'acc')
      .where('jl.storeId = :storeId', { storeId })
      .andWhere('je.status = :status', { status: FinanceJournalStatusEnum.POSTED })
      .andWhere('je.entryDate >= :startDate', { startDate })
      .andWhere('je.entryDate <= :endDate', { endDate })
      .getMany();

    if (journalLines.length > 0) {
      let productSales = 0;
      let shippingIncome = 0;
      let otherIncome = 0;
      let salesDiscounts = 0;
      let salesReturns = 0;

      let cogsProduct = 0;
      let cogsPackaging = 0;
      let cogsGatewayFees = 0;
      let cogsShippingFees = 0;

      let salary = 0;
      let employeeBenefits = 0;
      let marketing = 0;
      let software = 0;
      let rent = 0;
      let utilities = 0;
      let bankFees = 0;
      let inventoryLoss = 0;
      let otherOpex = 0;

      for (const line of journalLines) {
        const amt = Number(line.amount || 0);
        const code = line.accountCode;
        const cls = line.account.accountClass;

        if (cls === FinanceAccountClassEnum.REVENUE) {
          if (code === '4010') productSales += amt;
          else if (code === '4020') shippingIncome += amt;
          else if (code === '4090') salesDiscounts += amt;
          else if (code === '4095') salesReturns += amt;
          else otherIncome += amt;
        } else if (cls === FinanceAccountClassEnum.EXPENSE) {
          if (code === '5010') cogsProduct += amt;
          else if (code === '5020') cogsPackaging += amt;
          else if (code === '5030') cogsGatewayFees += amt;
          else if (code === '5040') cogsShippingFees += amt;
          else if (code === '6010') salary += amt;
          else if (code === '6020') employeeBenefits += amt;
          else if (code === '6030') marketing += amt;
          else if (code === '6040') software += amt;
          else if (code === '6050') rent += amt;
          else if (code === '6060') utilities += amt;
          else if (code === '6070') bankFees += amt;
          else if (code === '6080') inventoryLoss += amt;
          else otherOpex += amt;
        }
      }

      const grossRevenue = productSales + shippingIncome + otherIncome;
      const netRevenue = Math.max(0, grossRevenue - salesDiscounts - salesReturns);
      const totalCogs = cogsProduct + cogsPackaging + cogsGatewayFees + cogsShippingFees;
      const grossProfit = netRevenue - totalCogs;
      const grossMarginPercent = netRevenue > 0 ? Math.round((grossProfit / netRevenue) * 1000) / 10 : 0;

      const totalOperatingExpenses =
        salary + employeeBenefits + marketing + software + rent + utilities + bankFees + inventoryLoss + otherOpex;

      const operatingProfit = grossProfit - totalOperatingExpenses;
      const operatingMarginPercent = netRevenue > 0 ? Math.round((operatingProfit / netRevenue) * 1000) / 10 : 0;

      const netProfit = operatingProfit;
      const netMarginPercent = netRevenue > 0 ? Math.round((netProfit / netRevenue) * 1000) / 10 : 0;

      return {
        revenue: {
          productSales: Math.round(productSales * 100) / 100,
          shippingIncome: Math.round(shippingIncome * 100) / 100,
          otherIncome: Math.round(otherIncome * 100) / 100,
          salesDiscounts: Math.round(salesDiscounts * 100) / 100,
          salesReturns: Math.round(salesReturns * 100) / 100,
          grossRevenue: Math.round(grossRevenue * 100) / 100,
          totalRevenue: Math.round(netRevenue * 100) / 100,
        },
        cogs: {
          productCost: Math.round(cogsProduct * 100) / 100,
          packaging: Math.round(cogsPackaging * 100) / 100,
          gatewayFees: Math.round(cogsGatewayFees * 100) / 100,
          shippingFees: Math.round(cogsShippingFees * 100) / 100,
          totalCogs: Math.round(totalCogs * 100) / 100,
        },
        grossProfit: Math.round(grossProfit * 100) / 100,
        grossMarginPercent,
        operatingExpenses: {
          salary: Math.round(salary * 100) / 100,
          employeeBenefits: Math.round(employeeBenefits * 100) / 100,
          marketing: Math.round(marketing * 100) / 100,
          software: Math.round(software * 100) / 100,
          rent: Math.round(rent * 100) / 100,
          utilities: Math.round(utilities * 100) / 100,
          bankFees: Math.round(bankFees * 100) / 100,
          inventoryLoss: Math.round(inventoryLoss * 100) / 100,
          other: Math.round(otherOpex * 100) / 100,
          totalOperatingExpenses: Math.round(totalOperatingExpenses * 100) / 100,
        },
        operatingProfit: Math.round(operatingProfit * 100) / 100,
        operatingMarginPercent,
        netProfit: Math.round(netProfit * 100) / 100,
        netMarginPercent,
      };
    }

    // Fallback: Transactions table
    const transactions = await this.transactionRepository
      .createQueryBuilder('txn')
      .where('txn.storeId = :storeId', { storeId })
      .andWhere('txn.status = :status', { status: FinanceTransactionStatusEnum.COMPLETED })
      .andWhere('txn.transactionDate >= :startDate', { startDate })
      .andWhere('txn.transactionDate <= :endDate', { endDate })
      .getMany();

    let productSales = 0;
    let shippingIncome = 0;
    let otherIncome = 0;

    let cogs = 0;
    let marketing = 0;
    let salary = 0;
    let employeeExpenses = 0;
    let rent = 0;
    let utilities = 0;
    let software = 0;
    let shippingExpense = 0;
    let otherExpense = 0;

    for (const t of transactions) {
      const amt = Number(t.amount || 0);
      const code = (t.categoryCode || '').toUpperCase();

      if (t.type === FinanceTransactionTypeEnum.INCOME) {
        if (code === 'PRODUCT_SALES' || code === 'SALES') productSales += amt;
        else if (code === 'SHIPPING_INCOME' || code === 'DELIVERY') shippingIncome += amt;
        else otherIncome += amt;
      } else if (t.type === FinanceTransactionTypeEnum.EXPENSE) {
        if (code === 'COGS' || code === 'PRODUCT_COST' || code === 'INVENTORY') cogs += amt;
        else if (code === 'MARKETING' || code === 'ADS') marketing += amt;
        else if (code === 'SALARY' || code === 'PAYROLL') salary += amt;
        else if (code === 'EMPLOYEE_EXPENSES') employeeExpenses += amt;
        else if (code === 'RENT') rent += amt;
        else if (code === 'UTILITIES') utilities += amt;
        else if (code === 'SOFTWARE' || code === 'SAAS') software += amt;
        else if (code === 'SHIPPING' || code === 'COURIER') shippingExpense += amt;
        else otherExpense += amt;
      }
    }

    const totalRevenue = productSales + shippingIncome + otherIncome;
    const grossProfit = totalRevenue - cogs;
    const grossMarginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 1000) / 10 : 0;

    const totalOperatingExpenses =
      marketing + salary + employeeExpenses + rent + utilities + software + shippingExpense + otherExpense;

    const netProfit = grossProfit - totalOperatingExpenses;
    const netMarginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0;

    return {
      revenue: {
        productSales: Math.round(productSales * 100) / 100,
        shippingIncome: Math.round(shippingIncome * 100) / 100,
        otherIncome: Math.round(otherIncome * 100) / 100,
        salesDiscounts: 0,
        salesReturns: 0,
        grossRevenue: Math.round(totalRevenue * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      },
      cogs: {
        productCost: Math.round(cogs * 100) / 100,
        packaging: 0,
        gatewayFees: 0,
        shippingFees: 0,
        totalCogs: Math.round(cogs * 100) / 100,
      },
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossMarginPercent,
      operatingExpenses: {
        salary: Math.round(salary * 100) / 100,
        employeeBenefits: Math.round(employeeExpenses * 100) / 100,
        marketing: Math.round(marketing * 100) / 100,
        software: Math.round(software * 100) / 100,
        rent: Math.round(rent * 100) / 100,
        utilities: Math.round(utilities * 100) / 100,
        bankFees: 0,
        inventoryLoss: 0,
        other: Math.round(otherExpense * 100) / 100,
        totalOperatingExpenses: Math.round(totalOperatingExpenses * 100) / 100,
      },
      operatingProfit: Math.round(netProfit * 100) / 100,
      operatingMarginPercent: netMarginPercent,
      netProfit: Math.round(netProfit * 100) / 100,
      netMarginPercent,
    };
  }

  async execute(storeId: string, query: QueryFinancialReportDto) {
    const { startDate, endDate, previousStartDate, previousEndDate } = resolveDateRange(query);

    const currentMetrics = await this.calculatePeriodMetrics(storeId, startDate, endDate);
    const previousMetrics = await this.calculatePeriodMetrics(storeId, previousStartDate, previousEndDate);

    const growth = {
      revenueGrowth: calcGrowth(currentMetrics.revenue.totalRevenue, previousMetrics.revenue.totalRevenue),
      cogsGrowth: calcGrowth(currentMetrics.cogs.totalCogs, previousMetrics.cogs.totalCogs),
      grossProfitGrowth: calcGrowth(currentMetrics.grossProfit, previousMetrics.grossProfit),
      operatingExpensesGrowth: calcGrowth(
        currentMetrics.operatingExpenses.totalOperatingExpenses,
        previousMetrics.operatingExpenses.totalOperatingExpenses,
      ),
      netProfitGrowth: calcGrowth(currentMetrics.netProfit, previousMetrics.netProfit),
    };

    return {
      dateRange: { startDate, endDate },
      previousDateRange: { startDate: previousStartDate, endDate: previousEndDate },
      current: currentMetrics,
      previous: previousMetrics,
      growth,
      currency: 'BDT',
    };
  }
}
