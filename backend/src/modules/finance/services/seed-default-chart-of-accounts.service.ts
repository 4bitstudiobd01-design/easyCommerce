import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceChartOfAccountEntity } from '../entities/finance-chart-of-account.entity';
import {
  FinanceAccountClassEnum,
  FinanceNormalBalanceEnum,
} from '../enums/finance.enums';

export interface DefaultAccountDef {
  code: string;
  name: string;
  accountClass: FinanceAccountClassEnum;
  subType: string;
  normalBalance: FinanceNormalBalanceEnum;
  description: string;
}

export const DEFAULT_CHART_OF_ACCOUNTS: DefaultAccountDef[] = [
  // ASSETS (1000s)
  {
    code: '1010',
    name: 'Cash on Hand / Petty Cash',
    accountClass: FinanceAccountClassEnum.ASSET,
    subType: 'CASH_AND_EQUIVALENTS',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'Physical cash held for petty expenses and cash counter register',
  },
  {
    code: '1020',
    name: 'Main Business Bank Account',
    accountClass: FinanceAccountClassEnum.ASSET,
    subType: 'BANK',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'Primary commercial bank account for operating inflows and outflows',
  },
  {
    code: '1030',
    name: 'Payment Gateways Clearing',
    accountClass: FinanceAccountClassEnum.ASSET,
    subType: 'PAYMENT_GATEWAY',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'Online payment gateway settlements (bKash, Nagad, SSLCommerz, Stripe)',
  },
  {
    code: '1040',
    name: 'Courier & COD Clearing',
    accountClass: FinanceAccountClassEnum.ASSET,
    subType: 'COURIER_CLEARING',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'Cash-on-Delivery funds in transit with courier partners (Pathao, Steadfast, RedX)',
  },
  {
    code: '1200',
    name: 'Accounts Receivable (Customer Invoices)',
    accountClass: FinanceAccountClassEnum.ASSET,
    subType: 'CURRENT_ASSET',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'Uncollected customer invoice receivables and corporate credit balances',
  },
  {
    code: '1300',
    name: 'Merchandise Inventory Asset',
    accountClass: FinanceAccountClassEnum.ASSET,
    subType: 'INVENTORY',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'Total valuation of physical merchandise stock in warehouse',
  },

  // LIABILITIES (2000s)
  {
    code: '2010',
    name: 'Accounts Payable (Supplier Bills)',
    accountClass: FinanceAccountClassEnum.LIABILITY,
    subType: 'CURRENT_LIABILITY',
    normalBalance: FinanceNormalBalanceEnum.CREDIT,
    description: 'Outstanding unpaid bills and invoices due to suppliers and vendors',
  },
  {
    code: '2020',
    name: 'Sales Tax & VAT Payable',
    accountClass: FinanceAccountClassEnum.LIABILITY,
    subType: 'TAX_LIABILITY',
    normalBalance: FinanceNormalBalanceEnum.CREDIT,
    description: 'Collected sales tax and VAT liability owed to government revenue authorities',
  },
  {
    code: '2030',
    name: 'Salaries & Payroll Payable',
    accountClass: FinanceAccountClassEnum.LIABILITY,
    subType: 'PAYROLL_LIABILITY',
    normalBalance: FinanceNormalBalanceEnum.CREDIT,
    description: 'Accrued employee salaries, commissions, and payroll withholdings due',
  },
  {
    code: '2040',
    name: 'Unearned Revenue / Customer Deposits',
    accountClass: FinanceAccountClassEnum.LIABILITY,
    subType: 'CURRENT_LIABILITY',
    normalBalance: FinanceNormalBalanceEnum.CREDIT,
    description: 'Advance payments and deposits received before order delivery',
  },

  // EQUITY (3000s)
  {
    code: '3010',
    name: "Owner's Equity / Capital",
    accountClass: FinanceAccountClassEnum.EQUITY,
    subType: 'EQUITY',
    normalBalance: FinanceNormalBalanceEnum.CREDIT,
    description: 'Paid-in owner capital investment in the business',
  },
  {
    code: '3020',
    name: 'Retained Earnings',
    accountClass: FinanceAccountClassEnum.EQUITY,
    subType: 'EQUITY',
    normalBalance: FinanceNormalBalanceEnum.CREDIT,
    description: 'Cumulative retained earnings from prior fiscal operating periods',
  },

  // REVENUE (4000s)
  {
    code: '4010',
    name: 'E-Commerce Product Sales Revenue',
    accountClass: FinanceAccountClassEnum.REVENUE,
    subType: 'OPERATING_REVENUE',
    normalBalance: FinanceNormalBalanceEnum.CREDIT,
    description: 'Gross merchandise sales revenue from online store orders',
  },
  {
    code: '4020',
    name: 'Delivery & Shipping Revenue',
    accountClass: FinanceAccountClassEnum.REVENUE,
    subType: 'OPERATING_REVENUE',
    normalBalance: FinanceNormalBalanceEnum.CREDIT,
    description: 'Shipping fees collected from customers for order fulfillment',
  },
  {
    code: '4030',
    name: 'Other Operating Income',
    accountClass: FinanceAccountClassEnum.REVENUE,
    subType: 'OTHER_REVENUE',
    normalBalance: FinanceNormalBalanceEnum.CREDIT,
    description: 'Ancillary revenues, commission fees, and miscellaneous earnings',
  },
  {
    code: '4090',
    name: 'Sales Discounts & Promotional Allowances',
    accountClass: FinanceAccountClassEnum.REVENUE,
    subType: 'CONTRA_REVENUE',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'Coupons, promo codes, and customer discounts deducted from gross revenue',
  },
  {
    code: '4095',
    name: 'Sales Returns & Customer Refunds',
    accountClass: FinanceAccountClassEnum.REVENUE,
    subType: 'CONTRA_REVENUE',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'Reversals and refunds for returned customer merchandise',
  },

  // EXPENSES - COGS (5000s)
  {
    code: '5010',
    name: 'Cost of Goods Sold (COGS - Product Cost)',
    accountClass: FinanceAccountClassEnum.EXPENSE,
    subType: 'COGS',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'Direct procurement and manufacturing unit cost of merchandise sold',
  },
  {
    code: '5020',
    name: 'Fulfillment & Packaging Expense',
    accountClass: FinanceAccountClassEnum.EXPENSE,
    subType: 'COGS',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'Packaging boxes, tape, flyers, and order packing materials',
  },
  {
    code: '5030',
    name: 'Payment Gateway Processing Fees',
    accountClass: FinanceAccountClassEnum.EXPENSE,
    subType: 'COGS',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'Merchant transaction discount rates charged by bKash, Nagad, Visa/Mastercard',
  },
  {
    code: '5040',
    name: 'Delivery & Courier Shipping Fees',
    accountClass: FinanceAccountClassEnum.EXPENSE,
    subType: 'COGS',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'Third-party courier charges paid to Pathao, Steadfast, RedX, eCourier',
  },

  // EXPENSES - OPERATIONAL (6000s)
  {
    code: '6010',
    name: 'Employee Salaries & Payroll',
    accountClass: FinanceAccountClassEnum.EXPENSE,
    subType: 'OPERATING_EXPENSE',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'Monthly payroll, base wages, and staff allowances',
  },
  {
    code: '6020',
    name: 'Employee Reimbursements & Benefits',
    accountClass: FinanceAccountClassEnum.EXPENSE,
    subType: 'OPERATING_EXPENSE',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'Staff travel allowances, healthcare, meals, and expense claims',
  },
  {
    code: '6030',
    name: 'Marketing & Advertising Campaigns',
    accountClass: FinanceAccountClassEnum.EXPENSE,
    subType: 'OPERATING_EXPENSE',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'Paid ads across Meta, Google Ads, TikTok, SMS marketing, influencers',
  },
  {
    code: '6040',
    name: 'Software, SaaS & Cloud Subscriptions',
    accountClass: FinanceAccountClassEnum.EXPENSE,
    subType: 'OPERATING_EXPENSE',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'Software licenses, hosting, ERP modules, email tools, domain renewals',
  },
  {
    code: '6050',
    name: 'Rent & Office Operations',
    accountClass: FinanceAccountClassEnum.EXPENSE,
    subType: 'OPERATING_EXPENSE',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'Office/warehouse rent, repair, and general administrative facilities',
  },
  {
    code: '6060',
    name: 'Utilities & Internet',
    accountClass: FinanceAccountClassEnum.EXPENSE,
    subType: 'OPERATING_EXPENSE',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'Electricity, water, gas, high-speed broadband, and telephone services',
  },
  {
    code: '6070',
    name: 'Bank Charges & Financial Fees',
    accountClass: FinanceAccountClassEnum.EXPENSE,
    subType: 'OPERATING_EXPENSE',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'Bank service charges, wire transfer fees, and annual card fees',
  },
  {
    code: '6080',
    name: 'Inventory Loss & Breakage Write-Off',
    accountClass: FinanceAccountClassEnum.EXPENSE,
    subType: 'OPERATING_EXPENSE',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'Damaged, expired, broken, or stolen warehouse inventory write-downs',
  },
  {
    code: '6090',
    name: 'Miscellaneous General Expenses',
    accountClass: FinanceAccountClassEnum.EXPENSE,
    subType: 'OPERATING_EXPENSE',
    normalBalance: FinanceNormalBalanceEnum.DEBIT,
    description: 'General unclassified operational expenses and sundry disbursements',
  },
];

@Injectable()
export class SeedDefaultChartOfAccountsService {
  constructor(
    @InjectRepository(FinanceChartOfAccountEntity)
    private readonly coaRepository: Repository<FinanceChartOfAccountEntity>,
  ) {}

  async execute(tenantId: string, storeId: string): Promise<FinanceChartOfAccountEntity[]> {
    const existingCount = await this.coaRepository.count({
      where: { storeId },
    });

    if (existingCount > 0) {
      return this.coaRepository.find({
        where: { storeId },
        order: { code: 'ASC' },
      });
    }

    const createdList: FinanceChartOfAccountEntity[] = [];

    for (const def of DEFAULT_CHART_OF_ACCOUNTS) {
      const acc = this.coaRepository.create({
        tenantId,
        storeId,
        code: def.code,
        name: def.name,
        accountClass: def.accountClass,
        subType: def.subType,
        normalBalance: def.normalBalance,
        description: def.description,
        isSystem: true,
        isActive: true,
        currentBalance: '0',
        currency: 'BDT',
      });
      createdList.push(acc);
    }

    return this.coaRepository.save(createdList);
  }
}
