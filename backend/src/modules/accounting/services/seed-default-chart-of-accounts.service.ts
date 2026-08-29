import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AccountEntity,
  AccountTypeEnum,
  NormalBalanceEnum,
} from '../entities/account.entity';
import { AccountingSettingsEntity } from '../entities/accounting-settings.entity';
import {
  AccountMappingEntity,
  AccountMappingEventEnum,
} from '../entities/account-mapping.entity';

interface SeedAccount {
  code: string;
  name: string;
  type: AccountTypeEnum;
  description?: string;
}

const D = NormalBalanceEnum.DEBIT;
const C = NormalBalanceEnum.CREDIT;

function normalFor(type: AccountTypeEnum): NormalBalanceEnum {
  return type === AccountTypeEnum.ASSET || type === AccountTypeEnum.EXPENSE ? D : C;
}

/**
 * A compact Bangladesh-oriented chart of accounts for a retail / e-commerce merchant.
 * Codes match the ones the frontend design mocks reference (1010, 1020, 4010, 5001, …).
 */
const DEFAULT_CHART: SeedAccount[] = [
  // ── Assets (1000) ──────────────────────────────────────────────
  { code: '1010', name: 'Cash in Hand', type: AccountTypeEnum.ASSET, description: 'Physical cash in the register and petty cash box' },
  { code: '1020', name: 'Bank Account', type: AccountTypeEnum.ASSET, description: 'Primary merchant bank / current account' },
  { code: '1030', name: 'Mobile Banking Wallet', type: AccountTypeEnum.ASSET, description: 'bKash / Nagad / Rocket merchant balance' },
  { code: '1100', name: 'Accounts Receivable', type: AccountTypeEnum.ASSET, description: 'COD in transit and unsettled customer balances' },
  { code: '1200', name: 'Merchandise Inventory', type: AccountTypeEnum.ASSET, description: 'Stock on hand at cost' },
  { code: '1300', name: 'Prepaid Expenses', type: AccountTypeEnum.ASSET, description: 'Advance rent, subscriptions and deposits' },
  // ── Liabilities (2000) ─────────────────────────────────────────
  { code: '2010', name: 'Accounts Payable', type: AccountTypeEnum.LIABILITY, description: 'Amounts owed to suppliers and vendors' },
  { code: '2050', name: 'VAT / Tax Payable', type: AccountTypeEnum.LIABILITY, description: 'Output VAT and other taxes collected, not yet remitted' },
  { code: '2100', name: 'Accrued Expenses', type: AccountTypeEnum.LIABILITY, description: 'Expenses incurred but not yet paid' },
  // ── Equity (3000) ──────────────────────────────────────────────
  { code: '3010', name: 'Owner Capital', type: AccountTypeEnum.EQUITY, description: 'Capital contributed by the owner' },
  { code: '3020', name: 'Retained Earnings', type: AccountTypeEnum.EQUITY, description: 'Accumulated profit retained in the business' },
  { code: '3030', name: 'Owner Drawings', type: AccountTypeEnum.EQUITY, description: 'Withdrawals by the owner (contra-equity)' },
  // ── Revenue (4000) ─────────────────────────────────────────────
  { code: '4010', name: 'Storefront Sales', type: AccountTypeEnum.REVENUE, description: 'Gross e-commerce product sales' },
  { code: '4050', name: 'Shipping & Delivery Income', type: AccountTypeEnum.REVENUE, description: 'Delivery charges collected from customers' },
  { code: '4090', name: 'Sales Returns & Allowances', type: AccountTypeEnum.REVENUE, description: 'Refunds and returns (contra-revenue)' },
  // ── Expenses (5000) ────────────────────────────────────────────
  { code: '5001', name: 'Cost of Goods Sold', type: AccountTypeEnum.EXPENSE, description: 'Cost of inventory sold' },
  { code: '5010', name: 'Courier & Delivery Charges', type: AccountTypeEnum.EXPENSE, description: 'Amounts paid to courier partners' },
  { code: '5020', name: 'Packaging Supplies', type: AccountTypeEnum.EXPENSE, description: 'Boxes, tape, labels and packing material' },
  { code: '5030', name: 'Marketing & Advertising', type: AccountTypeEnum.EXPENSE, description: 'Ad spend and promotional costs' },
  { code: '5040', name: 'Payment Gateway Fees', type: AccountTypeEnum.EXPENSE, description: 'Settlement and processing charges' },
  { code: '5050', name: 'Rent Expense', type: AccountTypeEnum.EXPENSE, description: 'Office / warehouse rent' },
  { code: '5060', name: 'Utilities', type: AccountTypeEnum.EXPENSE, description: 'Electricity, internet, water' },
  { code: '5070', name: 'Salaries & Wages', type: AccountTypeEnum.EXPENSE, description: 'Staff compensation' },
  { code: '5080', name: 'Software Subscriptions', type: AccountTypeEnum.EXPENSE, description: 'SaaS tools and hosting' },
  { code: '5090', name: 'Bank Charges', type: AccountTypeEnum.EXPENSE, description: 'Account fees and transfer charges' },
  { code: '5900', name: 'Miscellaneous Expense', type: AccountTypeEnum.EXPENSE, description: 'Uncategorised operating costs' },
];

/** Which seeded account each automation event points at by default. */
const DEFAULT_MAPPINGS: Array<{ event: AccountMappingEventEnum; code: string }> = [
  { event: AccountMappingEventEnum.SALES_REVENUE, code: '4010' },
  { event: AccountMappingEventEnum.SHIPPING_INCOME, code: '4050' },
  { event: AccountMappingEventEnum.SALES_RETURNS, code: '4090' },
  { event: AccountMappingEventEnum.COURIER_COST, code: '5010' },
  { event: AccountMappingEventEnum.PAYMENT_GATEWAY_FEE, code: '5040' },
  { event: AccountMappingEventEnum.COGS, code: '5001' },
  { event: AccountMappingEventEnum.INVENTORY_ASSET, code: '1200' },
  { event: AccountMappingEventEnum.ACCOUNTS_RECEIVABLE, code: '1100' },
  { event: AccountMappingEventEnum.ACCOUNTS_PAYABLE, code: '2010' },
  { event: AccountMappingEventEnum.CASH, code: '1010' },
  { event: AccountMappingEventEnum.BANK, code: '1020' },
  { event: AccountMappingEventEnum.TAX_PAYABLE, code: '2050' },
];

/**
 * Populates a store's chart of accounts (and the default account mappings) the first time
 * the merchant opens the Accounting module. Idempotent: guarded by settings.chartSeeded and
 * a per-account existence check, so calling it twice is a no-op.
 */
@Injectable()
export class SeedDefaultChartOfAccountsService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    @InjectRepository(AccountingSettingsEntity)
    private readonly settingsRepository: Repository<AccountingSettingsEntity>,
    @InjectRepository(AccountMappingEntity)
    private readonly mappingRepository: Repository<AccountMappingEntity>,
  ) {}

  async execute(tenantId: string, storeId: string): Promise<void> {
    const settings = await this.settingsRepository.findOne({ where: { storeId } });
    if (settings?.chartSeeded) return;

    const existing = await this.accountRepository.find({ where: { storeId }, select: ['code'] });
    const existingCodes = new Set(existing.map((a) => a.code));

    const toCreate = DEFAULT_CHART.filter((a) => !existingCodes.has(a.code)).map((a) =>
      this.accountRepository.create({
        tenantId,
        storeId,
        code: a.code,
        name: a.name,
        type: a.type,
        normalBalance: normalFor(a.type),
        description: a.description,
        openingBalance: '0',
        isSystem: true,
        isActive: true,
      }),
    );

    if (toCreate.length > 0) {
      await this.accountRepository.save(toCreate);
    }

    const savedAccounts = await this.accountRepository.find({ where: { storeId } });
    const byCode = new Map(savedAccounts.map((a) => [a.code, a.id]));

    const existingMappings = await this.mappingRepository.find({ where: { storeId } });
    const mappedEvents = new Set(existingMappings.map((m) => m.event));

    const mappingsToCreate = DEFAULT_MAPPINGS.filter(
      (m) => !mappedEvents.has(m.event) && byCode.has(m.code),
    ).map((m) =>
      this.mappingRepository.create({
        tenantId,
        storeId,
        event: m.event,
        accountId: byCode.get(m.code),
      }),
    );

    if (mappingsToCreate.length > 0) {
      await this.mappingRepository.save(mappingsToCreate);
    }

    if (settings) {
      settings.chartSeeded = true;
      await this.settingsRepository.save(settings);
    }
  }
}
