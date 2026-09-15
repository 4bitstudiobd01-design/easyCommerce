import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../data-source';
import { StoreEntity } from '../../modules/tenant/entities/store.entity';
import { UserEntity, UserRoleEnum } from '../../modules/user/entities/user.entity';
import { CategoryEntity } from '../../modules/catalog/entities/category.entity';
import { ProductEntity } from '../../modules/catalog/entities/product.entity';
import { ProductVariantEntity } from '../../modules/catalog/entities/product-variant.entity';
import { ProductStatus } from '../../modules/catalog/enums/product-status.enum';
import { ProductType } from '../../modules/catalog/enums/product-type.enum';

// Purchase Entities & Enums
import { SupplierEntity, SupplierStatusEnum } from '../../modules/purchase/entities/supplier.entity';
import { PurchaseOrderEntity, PurchaseOrderStatusEnum } from '../../modules/purchase/entities/purchase-order.entity';
import { PurchaseOrderLineEntity } from '../../modules/purchase/entities/purchase-order-line.entity';
import { BillEntity, BillPaymentStatusEnum, BillStatusEnum } from '../../modules/purchase/entities/bill.entity';
import { BillLineEntity } from '../../modules/purchase/entities/bill-line.entity';
import { SupplierPaymentEntity, SupplierPaymentMethodEnum } from '../../modules/purchase/entities/supplier-payment.entity';

// Finance Entities & Enums
import { FinanceAccountEntity } from '../../modules/finance/entities/finance-account.entity';
import { FinanceCategoryEntity } from '../../modules/finance/entities/finance-category.entity';
import { FinanceTransactionEntity } from '../../modules/finance/entities/finance-transaction.entity';
import { FinanceInvoiceEntity } from '../../modules/finance/entities/finance-invoice.entity';
import { FinanceInvoiceItemEntity } from '../../modules/finance/entities/finance-invoice-item.entity';
import { FinanceBillEntity } from '../../modules/finance/entities/finance-bill.entity';
import { FinanceBillItemEntity } from '../../modules/finance/entities/finance-bill-item.entity';
import { FinanceTransferEntity } from '../../modules/finance/entities/finance-transfer.entity';
import { FinanceSettingEntity } from '../../modules/finance/entities/finance-setting.entity';
import {
  FinanceAccountTypeEnum,
  FinanceCategoryTypeEnum,
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceSourceTypeEnum,
  FinanceInvoiceStatusEnum,
  FinanceBillStatusEnum,
  FinanceTransferStatusEnum,
} from '../../modules/finance/enums/finance.enums';

// Accounting Entities & Enums
import { AccountEntity, AccountTypeEnum, NormalBalanceEnum } from '../../modules/accounting/entities/account.entity';
import { AccountingSettingsEntity } from '../../modules/accounting/entities/accounting-settings.entity';
import { AccountMappingEntity, AccountMappingEventEnum } from '../../modules/accounting/entities/account-mapping.entity';
import { NumberingRuleEntity, NumberingDocTypeEnum } from '../../modules/accounting/entities/numbering-rule.entity';
import { ExpenseEntity, ExpensePaymentMethodEnum, ExpenseStatusEnum } from '../../modules/accounting/entities/expense.entity';
import { JournalEntryEntity, JournalStatusEnum, JournalSourceEnum } from '../../modules/accounting/entities/journal-entry.entity';
import { JournalLineEntity } from '../../modules/accounting/entities/journal-line.entity';

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysAhead(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

async function run() {
  console.log('🚀 Starting Complete Accounting, Purchase & Finance Demo Data Seeder...');
  await AppDataSource.initialize();
  console.log('✅ Database connected.');

  const storeRepo = AppDataSource.getRepository(StoreEntity);
  const userRepo = AppDataSource.getRepository(UserEntity);
  const categoryRepo = AppDataSource.getRepository(CategoryEntity);
  const productRepo = AppDataSource.getRepository(ProductEntity);
  const variantRepo = AppDataSource.getRepository(ProductVariantEntity);

  // Accounting Repos
  const accRepo = AppDataSource.getRepository(AccountEntity);
  const accSettingsRepo = AppDataSource.getRepository(AccountingSettingsEntity);
  const accMappingRepo = AppDataSource.getRepository(AccountMappingEntity);
  const numberingRepo = AppDataSource.getRepository(NumberingRuleEntity);
  const expenseRepo = AppDataSource.getRepository(ExpenseEntity);
  const journalRepo = AppDataSource.getRepository(JournalEntryEntity);
  const journalLineRepo = AppDataSource.getRepository(JournalLineEntity);

  // Purchase Repos
  const supplierRepo = AppDataSource.getRepository(SupplierEntity);
  const poRepo = AppDataSource.getRepository(PurchaseOrderEntity);
  const poLineRepo = AppDataSource.getRepository(PurchaseOrderLineEntity);
  const billRepo = AppDataSource.getRepository(BillEntity);
  const billLineRepo = AppDataSource.getRepository(BillLineEntity);
  const paymentRepo = AppDataSource.getRepository(SupplierPaymentEntity);

  // Finance Repos
  const finAccountRepo = AppDataSource.getRepository(FinanceAccountEntity);
  const finCatRepo = AppDataSource.getRepository(FinanceCategoryEntity);
  const finTxRepo = AppDataSource.getRepository(FinanceTransactionEntity);
  const finInvRepo = AppDataSource.getRepository(FinanceInvoiceEntity);
  const finInvItemRepo = AppDataSource.getRepository(FinanceInvoiceItemEntity);
  const finBillRepo = AppDataSource.getRepository(FinanceBillEntity);
  const finBillItemRepo = AppDataSource.getRepository(FinanceBillItemEntity);
  const finTransferRepo = AppDataSource.getRepository(FinanceTransferEntity);
  const finSettingRepo = AppDataSource.getRepository(FinanceSettingEntity);

  const stores = await storeRepo.find();
  if (stores.length === 0) {
    console.error('❌ No stores found in the database. Run initial seed first.');
    process.exit(1);
  }

  const defaultUser =
    (await userRepo.findOne({ where: { role: UserRoleEnum.SUPER_ADMIN } })) ||
    (await userRepo.findOne({ where: {} }));
  const actorId = defaultUser?.id ?? '00000000-0000-0000-0000-000000000000';

  for (const store of stores) {
    console.log(`\n======================================================`);
    console.log(`🏪 Seeding Store: "${store.name}" (${store.id}) [Tenant: ${store.tenantId}]`);
    console.log(`======================================================`);

    const tenantId = store.tenantId;
    const storeId = store.id;

    // ─────────────────────────────────────────────────────────────
    // 1. ENSURE CATALOG PRODUCTS EXIST
    // ─────────────────────────────────────────────────────────────
    let products = await productRepo.find({ where: { tenantId } });
    if (products.length === 0) {
      console.log('📦 No products found. Seeding demo catalog products...');
      let cat = await categoryRepo.findOne({ where: { tenantId } });
      if (!cat) {
        cat = await categoryRepo.save(
          categoryRepo.create({
            tenantId,
            name: 'General Apparel',
            slug: `general-apparel-${storeId.slice(0, 6)}`,
            description: 'Standard retail clothing and accessories',
          }),
        );
      }

      const sampleProductsData = [
        { name: 'Premium Cotton Oxford Shirt', price: 1450, cost: 750, sku: 'SHT-OXF-001' },
        { name: 'Slim Fit Denim Jeans (Indigo)', price: 2200, cost: 1100, sku: 'JNS-IND-002' },
        { name: 'Classic Leather Bi-Fold Wallet', price: 950, cost: 420, sku: 'WLT-LEA-003' },
        { name: 'Wireless Bluetooth Earbuds Pro', price: 3400, cost: 1800, sku: 'EBD-PRO-004' },
        { name: 'Minimalist Chrono Wristwatch', price: 4200, cost: 2100, sku: 'WCH-MIN-005' },
        { name: 'Organic Premium Green Tea 250g', price: 650, cost: 310, sku: 'TEA-GRN-006' },
      ];

      for (const p of sampleProductsData) {
        const prod = await productRepo.save(
          productRepo.create({
            tenantId,
            categoryId: cat.id,
            name: p.name,
            slug: `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`,
            description: `High quality ${p.name} designed for long-lasting performance and style.`,
            productType: ProductType.PHYSICAL,
            status: ProductStatus.ACTIVE,
            basePrice: p.price,
            costPrice: p.cost,
            sku: p.sku,
            trackInventory: true,
            isPublished: true,
          }),
        );
        await variantRepo.save(
          variantRepo.create({
            tenantId,
            productId: prod.id,
            title: 'Regular',
            sku: `${p.sku}-REG`,
            price: p.price,
            costPrice: p.cost,
          }),
        );
      }
      products = await productRepo.find({ where: { tenantId } });
      console.log(`✅ Seeded ${products.length} catalog products.`);
    }

    // ─────────────────────────────────────────────────────────────
    // 2. ACCOUNTING MODULE SEED
    // ─────────────────────────────────────────────────────────────
    console.log('📒 Seeding Accounting Module (COA, Settings, Numbering Rules, Journal Entries, Expenses)...');

    // A. Settings
    let accSettings = await accSettingsRepo.findOne({ where: { storeId } });
    if (!accSettings) {
      accSettings = await accSettingsRepo.save(
        accSettingsRepo.create({
          tenantId,
          storeId,
          fiscalYearStartMonth: 7,
          baseCurrency: 'BDT',
          autoPostEnabled: true,
          allowDraftEntries: true,
          chartSeeded: false,
        }),
      );
    }

    // B. Chart of Accounts
    const defaultChart = [
      { code: '1010', name: 'Cash in Hand', type: AccountTypeEnum.ASSET, description: 'Physical cash in the register and petty cash box' },
      { code: '1020', name: 'Bank Account', type: AccountTypeEnum.ASSET, description: 'Primary merchant bank current account' },
      { code: '1030', name: 'Mobile Banking Wallet', type: AccountTypeEnum.ASSET, description: 'bKash / Nagad merchant balances' },
      { code: '1100', name: 'Accounts Receivable', type: AccountTypeEnum.ASSET, description: 'COD in transit and unsettled customer balances' },
      { code: '1200', name: 'Merchandise Inventory', type: AccountTypeEnum.ASSET, description: 'Stock on hand at cost' },
      { code: '1300', name: 'Prepaid Expenses', type: AccountTypeEnum.ASSET, description: 'Advance rent, subscriptions and deposits' },
      { code: '2010', name: 'Accounts Payable', type: AccountTypeEnum.LIABILITY, description: 'Amounts owed to suppliers and vendors' },
      { code: '2050', name: 'VAT / Tax Payable', type: AccountTypeEnum.LIABILITY, description: 'Output VAT and other taxes collected' },
      { code: '2100', name: 'Accrued Expenses', type: AccountTypeEnum.LIABILITY, description: 'Expenses incurred but not yet paid' },
      { code: '3010', name: 'Owner Capital', type: AccountTypeEnum.EQUITY, description: 'Capital contributed by the owner' },
      { code: '3020', name: 'Retained Earnings', type: AccountTypeEnum.EQUITY, description: 'Accumulated profit retained in the business' },
      { code: '3030', name: 'Owner Drawings', type: AccountTypeEnum.EQUITY, description: 'Withdrawals by the owner' },
      { code: '4010', name: 'Storefront Sales', type: AccountTypeEnum.REVENUE, description: 'Gross e-commerce product sales' },
      { code: '4050', name: 'Shipping & Delivery Income', type: AccountTypeEnum.REVENUE, description: 'Delivery charges collected from customers' },
      { code: '4090', name: 'Sales Returns & Allowances', type: AccountTypeEnum.REVENUE, description: 'Refunds and returns (contra-revenue)' },
      { code: '5001', name: 'Cost of Goods Sold', type: AccountTypeEnum.EXPENSE, description: 'Cost of inventory sold' },
      { code: '5010', name: 'Courier & Delivery Charges', type: AccountTypeEnum.EXPENSE, description: 'Amounts paid to courier partners' },
      { code: '5020', name: 'Packaging Supplies', type: AccountTypeEnum.EXPENSE, description: 'Boxes, tape, labels and packing material' },
      { code: '5030', name: 'Marketing & Advertising', type: AccountTypeEnum.EXPENSE, description: 'Ad spend and promotional costs' },
      { code: '5040', name: 'Payment Gateway Fees', type: AccountTypeEnum.EXPENSE, description: 'Settlement and processing charges' },
      { code: '5050', name: 'Rent Expense', type: AccountTypeEnum.EXPENSE, description: 'Office and warehouse rent' },
      { code: '5060', name: 'Utilities', type: AccountTypeEnum.EXPENSE, description: 'Electricity, internet, water' },
      { code: '5070', name: 'Salaries & Wages', type: AccountTypeEnum.EXPENSE, description: 'Staff compensation' },
      { code: '5080', name: 'Software Subscriptions', type: AccountTypeEnum.EXPENSE, description: 'SaaS tools, domain and hosting' },
      { code: '5090', name: 'Bank Charges', type: AccountTypeEnum.EXPENSE, description: 'Account fees and transfer charges' },
      { code: '5900', name: 'Miscellaneous Expense', type: AccountTypeEnum.EXPENSE, description: 'Uncategorised operating costs' },
    ];

    const accountByCode = new Map<string, AccountEntity>();
    for (const item of defaultChart) {
      let acc = await accRepo.findOne({ where: { storeId, code: item.code } });
      if (!acc) {
        acc = await accRepo.save(
          accRepo.create({
            tenantId,
            storeId,
            code: item.code,
            name: item.name,
            type: item.type,
            normalBalance:
              item.type === AccountTypeEnum.ASSET || item.type === AccountTypeEnum.EXPENSE
                ? NormalBalanceEnum.DEBIT
                : NormalBalanceEnum.CREDIT,
            description: item.description,
            openingBalance: '0',
            isSystem: true,
            isActive: true,
          }),
        );
      }
      accountByCode.set(item.code, acc);
    }

    accSettings.chartSeeded = true;
    await accSettingsRepo.save(accSettings);

    // C. Numbering Rules
    const docRules = [
      { docType: NumberingDocTypeEnum.JOURNAL_ENTRY, prefix: 'JE-', nextSeq: 20 },
      { docType: NumberingDocTypeEnum.EXPENSE, prefix: 'EXP-', nextSeq: 15 },
      { docType: NumberingDocTypeEnum.DEBIT_NOTE, prefix: 'DN-', nextSeq: 5 },
      { docType: NumberingDocTypeEnum.CREDIT_NOTE, prefix: 'CN-', nextSeq: 5 },
    ];
    for (const r of docRules) {
      let rule = await numberingRepo.findOne({ where: { storeId, docType: r.docType } });
      if (!rule) {
        await numberingRepo.save(
          numberingRepo.create({
            tenantId,
            storeId,
            docType: r.docType,
            prefix: r.prefix,
            suffix: '',
            includeYear: true,
            padWidth: 4,
            nextSequence: r.nextSeq,
          }),
        );
      }
    }

    // D. Account Mappings
    const defaultMappings = [
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

    for (const m of defaultMappings) {
      const acc = accountByCode.get(m.code);
      if (acc) {
        let existingMap = await accMappingRepo.findOne({ where: { storeId, event: m.event } });
        if (!existingMap) {
          await accMappingRepo.save(
            accMappingRepo.create({
              tenantId,
              storeId,
              event: m.event,
              accountId: acc.id,
            }),
          );
        }
      }
    }

    // E. Journal Entries & Balanced Lines
    const existingJournals = await journalRepo.count({ where: { storeId } });
    if (existingJournals === 0) {
      const journalData = [
        {
          num: 'JE-2026-0001',
          date: daysAgo(28),
          desc: 'Initial Owner Capital Injection into Current Bank Account',
          ref: 'BANK-DEP-001',
          source: JournalSourceEnum.OPENING_BALANCE,
          status: JournalStatusEnum.POSTED,
          lines: [
            { code: '1020', debit: 600000, credit: 0, memo: 'Capital deposited into City Bank' },
            { code: '3010', debit: 0, credit: 600000, memo: 'Owner initial investment equity' },
          ],
        },
        {
          num: 'JE-2026-0002',
          date: daysAgo(25),
          desc: 'Bulk Merchandise Inventory Purchase from Vendor',
          ref: 'PUR-2026-0101',
          source: JournalSourceEnum.PURCHASE,
          status: JournalStatusEnum.POSTED,
          lines: [
            { code: '1200', debit: 145000, credit: 0, memo: 'Apparel stock received in warehouse' },
            { code: '2010', debit: 0, credit: 145000, memo: 'Payable to ABC Wholesale Ltd' },
          ],
        },
        {
          num: 'JE-2026-0003',
          date: daysAgo(22),
          desc: 'Supplier Bill Payment via Corporate Bank Transfer',
          ref: 'SPAY-2026-0001',
          source: JournalSourceEnum.SUPPLIER_PAYMENT,
          status: JournalStatusEnum.POSTED,
          lines: [
            { code: '2010', debit: 75000, credit: 0, memo: 'Partial payment on ABC Wholesale bill' },
            { code: '1020', debit: 0, credit: 75000, memo: 'Transferred from City Bank Account' },
          ],
        },
        {
          num: 'JE-2026-0004',
          date: daysAgo(18),
          desc: 'E-Commerce Online Storefront Sales Settlement (Week 1)',
          ref: 'ORD-BATCH-W1',
          source: JournalSourceEnum.ORDER,
          status: JournalStatusEnum.POSTED,
          lines: [
            { code: '1030', debit: 125000, credit: 0, memo: 'bKash merchant collections' },
            { code: '4010', debit: 0, credit: 110000, memo: 'Gross product retail sales' },
            { code: '4050', debit: 0, credit: 15000, memo: 'Customer shipping delivery income' },
          ],
        },
        {
          num: 'JE-2026-0005',
          date: daysAgo(18),
          desc: 'Cost of Goods Sold (COGS) for Week 1 Orders',
          ref: 'COGS-BATCH-W1',
          source: JournalSourceEnum.INVENTORY,
          status: JournalStatusEnum.POSTED,
          lines: [
            { code: '5001', debit: 58000, credit: 0, memo: 'Cost of goods dispatched to customers' },
            { code: '1200', debit: 0, credit: 58000, memo: 'Inventory relieved from warehouse' },
          ],
        },
        {
          num: 'JE-2026-0006',
          date: daysAgo(15),
          desc: 'Corporate Bulk Uniform Sale on Credit (Wholesale)',
          ref: 'INV-2026-0002',
          source: JournalSourceEnum.MANUAL,
          status: JournalStatusEnum.POSTED,
          lines: [
            { code: '1100', debit: 85000, credit: 0, memo: 'Receivable from Shamsul Tech Ltd' },
            { code: '4010', debit: 0, credit: 80000, memo: 'Bulk apparel sale revenue' },
            { code: '2050', debit: 0, credit: 5000, memo: '5% VAT collected on corporate invoice' },
          ],
        },
        {
          num: 'JE-2026-0007',
          date: daysAgo(12),
          desc: 'Monthly Showroom & Office Rent Payment',
          ref: 'EXP-2026-0001',
          source: JournalSourceEnum.EXPENSE,
          status: JournalStatusEnum.POSTED,
          lines: [
            { code: '5050', debit: 35000, credit: 0, memo: 'Office rent for the current month' },
            { code: '1020', debit: 0, credit: 35000, memo: 'Paid from Bank Account' },
          ],
        },
        {
          num: 'JE-2026-0008',
          date: daysAgo(10),
          desc: 'Staff Monthly Payroll & Wages Disbursement',
          ref: 'EXP-2026-0003',
          source: JournalSourceEnum.EXPENSE,
          status: JournalStatusEnum.POSTED,
          lines: [
            { code: '5070', debit: 48000, credit: 0, memo: 'Staff salary compensation' },
            { code: '1020', debit: 0, credit: 48000, memo: 'Direct bank payroll transfer' },
          ],
        },
        {
          num: 'JE-2026-0009',
          date: daysAgo(7),
          desc: 'Facebook & Google Digital Ads Campaign Spend',
          ref: 'EXP-2026-0002',
          source: JournalSourceEnum.EXPENSE,
          status: JournalStatusEnum.POSTED,
          lines: [
            { code: '5030', debit: 18500, credit: 0, memo: 'Digital advertising campaign spend' },
            { code: '1020', debit: 0, credit: 18500, memo: 'Settled via corporate card' },
          ],
        },
        {
          num: 'JE-2026-0010',
          date: daysAgo(5),
          desc: 'Steadfast Courier Charges & COD Delivery Settlement',
          ref: 'EXP-2026-0004',
          source: JournalSourceEnum.EXPENSE,
          status: JournalStatusEnum.POSTED,
          lines: [
            { code: '5010', debit: 12400, credit: 0, memo: 'Courier parcel shipping fees' },
            { code: '1030', debit: 0, credit: 12400, memo: 'Paid from bKash merchant wallet' },
          ],
        },
        {
          num: 'JE-2026-0011',
          date: daysAgo(3),
          desc: 'E-Commerce Online Storefront Sales Settlement (Week 2)',
          ref: 'ORD-BATCH-W2',
          source: JournalSourceEnum.ORDER,
          status: JournalStatusEnum.POSTED,
          lines: [
            { code: '1030', debit: 142000, credit: 0, memo: 'bKash merchant collections' },
            { code: '4010', debit: 0, credit: 128000, memo: 'Product sales revenue' },
            { code: '4050', debit: 0, credit: 14000, memo: 'Shipping fee income' },
          ],
        },
        {
          num: 'JE-2026-0012',
          date: daysAgo(3),
          desc: 'Cost of Goods Sold (COGS) for Week 2 Orders',
          ref: 'COGS-BATCH-W2',
          source: JournalSourceEnum.INVENTORY,
          status: JournalStatusEnum.POSTED,
          lines: [
            { code: '5001', debit: 64000, credit: 0, memo: 'Cost of inventory sold in Week 2' },
            { code: '1200', debit: 0, credit: 64000, memo: 'Relieved from inventory' },
          ],
        },
        {
          num: 'JE-2026-0013',
          date: daysAgo(2),
          desc: 'Customer Sales Return / Defective Item Refund',
          ref: 'RET-2026-001',
          source: JournalSourceEnum.ORDER,
          status: JournalStatusEnum.POSTED,
          lines: [
            { code: '4090', debit: 4500, credit: 0, memo: 'Sales return contra-revenue' },
            { code: '1030', debit: 0, credit: 4500, memo: 'Refunded via bKash wallet' },
          ],
        },
        {
          num: 'JE-2026-0014',
          date: daysAgo(1),
          desc: 'Month-End Accrued Electricity & Utility Expense Adjustment',
          ref: 'ADJ-DRAFT-01',
          source: JournalSourceEnum.MANUAL,
          status: JournalStatusEnum.DRAFT,
          lines: [
            { code: '5060', debit: 8200, credit: 0, memo: 'Estimated accrued electricity' },
            { code: '2100', debit: 0, credit: 8200, memo: 'Accrued utility liability' },
          ],
        },
      ];

      for (const j of journalData) {
        let totalDebit = 0;
        let totalCredit = 0;

        const lines: JournalLineEntity[] = [];
        for (let idx = 0; idx < j.lines.length; idx++) {
          const l = j.lines[idx];
          const acc = accountByCode.get(l.code);
          if (!acc) continue;

          totalDebit += l.debit;
          totalCredit += l.credit;

          lines.push(
            journalLineRepo.create({
              storeId,
              accountId: acc.id,
              accountCode: acc.code,
              accountName: acc.name,
              debit: String(l.debit.toFixed(2)),
              credit: String(l.credit.toFixed(2)),
              memo: l.memo,
              lineOrder: idx,
            }),
          );
        }

        await journalRepo.save(
          journalRepo.create({
            tenantId,
            storeId,
            entryNumber: j.num,
            date: j.date,
            description: j.desc,
            reference: j.ref,
            status: j.status,
            source: j.source,
            totalDebit: String(totalDebit.toFixed(2)),
            totalCredit: String(totalCredit.toFixed(2)),
            postedAt: j.status === JournalStatusEnum.POSTED ? new Date(j.date) : undefined,
            createdByUserId: actorId,
            lines,
          }),
        );
      }
      console.log(`✅ Seeded ${journalData.length} balanced journal entries & ledger postings.`);
    }

    // F. Operating Expenses
    const existingExpenses = await expenseRepo.count({ where: { storeId } });
    if (existingExpenses === 0) {
      const bankAcc = accountByCode.get('1020');
      const cashAcc = accountByCode.get('1010');
      const bkashAcc = accountByCode.get('1030');

      const expenseList = [
        { num: 'EXP-2026-0001', date: daysAgo(12), title: 'Monthly Showroom & Office Rent', cat: 'Rent', vendor: 'Dhaka City Properties Ltd.', amt: '35000.00', method: ExpensePaymentMethodEnum.BANK_TRANSFER, status: ExpenseStatusEnum.PAID, accCode: '5050', paidFrom: bankAcc },
        { num: 'EXP-2026-0002', date: daysAgo(7), title: 'Facebook & Instagram Ads Campaign', cat: 'Marketing', vendor: 'Meta Platforms Ireland', amt: '18500.00', method: ExpensePaymentMethodEnum.CARD, status: ExpenseStatusEnum.PAID, accCode: '5030', paidFrom: bankAcc },
        { num: 'EXP-2026-0003', date: daysAgo(10), title: 'Staff Monthly Payroll & Allowances', cat: 'Salaries', vendor: 'Store Staff Team', amt: '48000.00', method: ExpensePaymentMethodEnum.BANK_TRANSFER, status: ExpenseStatusEnum.PAID, accCode: '5070', paidFrom: bankAcc },
        { num: 'EXP-2026-0004', date: daysAgo(5), title: 'Steadfast Courier Delivery Charges', cat: 'Courier', vendor: 'Steadfast Courier Ltd', amt: '12400.00', method: ExpensePaymentMethodEnum.MOBILE_BANKING, status: ExpenseStatusEnum.PAID, accCode: '5010', paidFrom: bkashAcc },
        { num: 'EXP-2026-0005', date: daysAgo(16), title: 'Custom Branded Packaging Boxes & Tape', cat: 'Packaging', vendor: 'Apex Packaging Industries', amt: '6800.00', method: ExpensePaymentMethodEnum.CASH, status: ExpenseStatusEnum.PAID, accCode: '5020', paidFrom: cashAcc },
        { num: 'EXP-2026-0006', date: daysAgo(8), title: 'Electricity & Power Utility Bill', cat: 'Utilities', vendor: 'DESCO Commercial', amt: '7950.00', method: ExpensePaymentMethodEnum.MOBILE_BANKING, status: ExpenseStatusEnum.PAID, accCode: '5060', paidFrom: bkashAcc },
        { num: 'EXP-2026-0007', date: daysAgo(14), title: 'Dedicated High-Speed Fiber Internet', cat: 'Utilities', vendor: 'Carnival Internet PLC', amt: '3200.00', method: ExpensePaymentMethodEnum.CASH, status: ExpenseStatusEnum.PAID, accCode: '5060', paidFrom: cashAcc },
        { num: 'EXP-2026-0008', date: daysAgo(4), title: 'SaaS Software & Hosting Subscriptions', cat: 'Software', vendor: 'Cloud Infrastructure Inc', amt: '5400.00', method: ExpensePaymentMethodEnum.CARD, status: ExpenseStatusEnum.PAID, accCode: '5080', paidFrom: bankAcc },
        { num: 'EXP-2026-0009', date: daysAgo(2), title: 'Showroom Lighting & Electrical Repairs', cat: 'Maintenance', vendor: 'City Electricians', amt: '4500.00', method: ExpensePaymentMethodEnum.CASH, status: ExpenseStatusEnum.DUE, accCode: '5900', paidFrom: null },
        { num: 'EXP-2026-0010', date: daysAgo(1), title: 'Promotional Product Tags & Hangtags', cat: 'Marketing', vendor: 'Nilkhet Print Hub', amt: '2800.00', method: ExpensePaymentMethodEnum.CASH, status: ExpenseStatusEnum.DUE, accCode: '5030', paidFrom: null },
      ];

      for (const e of expenseList) {
        const expAcc = accountByCode.get(e.accCode);
        await expenseRepo.save(
          expenseRepo.create({
            tenantId,
            storeId,
            expenseNumber: e.num,
            date: e.date,
            title: e.title,
            category: e.cat,
            vendor: e.vendor,
            amount: e.amt,
            paymentMethod: e.method,
            status: e.status,
            expenseAccountId: expAcc?.id,
            paidFromAccountId: e.paidFrom?.id,
            note: 'Operational business expense voucher.',
            createdByUserId: actorId,
          }),
        );
      }
      console.log(`✅ Seeded ${expenseList.length} accounting operating expenses.`);
    }

    // ─────────────────────────────────────────────────────────────
    // 3. PURCHASE MODULE SEED
    // ─────────────────────────────────────────────────────────────
    console.log('🛒 Checking/Seeding Purchase Module...');
    const demoSuppliersData = [
      { name: 'ABC Wholesale Ltd.', contactPerson: 'Arif Rahman', phone: '+880 1712-345678', email: 'arif@abcwholesale.com', location: 'Dhaka Wholesale Market' },
      { name: 'Fashion Mart Global', contactPerson: 'Nusrat Jahan', phone: '+880 1811-223344', email: 'nusrat@fashionmart.com', location: 'Agrabad, Chittagong' },
      { name: 'Style Traders BD', contactPerson: 'Kamal Hossain', phone: '+880 1911-556677', email: 'kamal@styletraders.com', location: 'Zindabazar, Sylhet' },
      { name: 'Global Textile Imports', contactPerson: 'Sadia Islam', phone: '+880 1611-889900', email: 'sadia@globalimports.com', location: 'Shibbari, Khulna' },
      { name: 'Top Line Goods Co.', contactPerson: 'Rezaul Karim', phone: '+880 1511-101010', email: 'rezaul@topgoods.com', location: 'Shaheb Bazar, Rajshahi' },
    ];

    const savedSuppliers: SupplierEntity[] = [];
    for (const s of demoSuppliersData) {
      let supp = await supplierRepo.findOne({ where: { storeId, name: s.name } });
      if (!supp) {
        supp = await supplierRepo.save(
          supplierRepo.create({
            tenantId,
            storeId,
            name: s.name,
            contactPerson: s.contactPerson,
            phone: s.phone,
            email: s.email,
            location: s.location,
            status: SupplierStatusEnum.ACTIVE,
            openingBalance: '0',
            notes: 'Verified trusted vendor.',
            createdByUserId: actorId,
          }),
        );
      }
      savedSuppliers.push(supp);
    }

    const existingPOs = await poRepo.count({ where: { storeId } });
    if (existingPOs === 0 && products.length > 0) {
      const poConfigs = [
        { poNumber: 'PO-2026-0001', supplier: savedSuppliers[0], status: PurchaseOrderStatusEnum.FULLY_RECEIVED, dateAgo: 20 },
        { poNumber: 'PO-2026-0002', supplier: savedSuppliers[1], status: PurchaseOrderStatusEnum.PARTIALLY_RECEIVED, dateAgo: 14 },
        { poNumber: 'PO-2026-0003', supplier: savedSuppliers[2], status: PurchaseOrderStatusEnum.SENT, dateAgo: 7 },
        { poNumber: 'PO-2026-0004', supplier: savedSuppliers[3], status: PurchaseOrderStatusEnum.DRAFT, dateAgo: 2 },
        { poNumber: 'PO-2026-0005', supplier: savedSuppliers[4], status: PurchaseOrderStatusEnum.CANCELLED, dateAgo: 25 },
      ];

      for (const [idx, cfg] of poConfigs.entries()) {
        const lineProducts = [products[idx % products.length], products[(idx + 1) % products.length]];
        let total = 0;
        let receivedVal = 0;

        const lines: PurchaseOrderLineEntity[] = [];
        for (let lineIdx = 0; lineIdx < lineProducts.length; lineIdx++) {
          const p = lineProducts[lineIdx];
          const qty = 20 + lineIdx * 15;
          const unitCost = Number(p.costPrice) || 650;
          const lineTotal = qty * unitCost;
          total += lineTotal;
          const recQty =
            cfg.status === PurchaseOrderStatusEnum.FULLY_RECEIVED
              ? qty
              : cfg.status === PurchaseOrderStatusEnum.PARTIALLY_RECEIVED
                ? Math.floor(qty / 2)
                : 0;
          receivedVal += recQty * unitCost;

          lines.push(
            poLineRepo.create({
              storeId,
              productId: p.id,
              productName: p.name,
              sku: p.sku || `SKU-${idx}-${lineIdx}`,
              quantity: qty,
              receivedQuantity: recQty,
              unitCost: String(unitCost),
              lineTotal: String(lineTotal),
              lineOrder: lineIdx,
            }),
          );
        }

        await poRepo.save(
          poRepo.create({
            tenantId,
            storeId,
            poNumber: cfg.poNumber,
            supplierId: cfg.supplier.id,
            supplierName: cfg.supplier.name,
            orderDate: daysAgo(cfg.dateAgo),
            expectedDate: daysAhead(7 - cfg.dateAgo),
            status: cfg.status,
            subtotal: String(total),
            totalAmount: String(total),
            receivedValue: String(receivedVal),
            notes: `Purchase order for standard replenishment.`,
            createdByUserId: actorId,
            lines,
          }),
        );
      }
      console.log(`✅ Seeded ${poConfigs.length} purchase orders.`);
    }

    const existingBills = await billRepo.count({ where: { storeId } });
    if (existingBills === 0 && products.length > 0) {
      const billConfigs = [
        { billNumber: 'PUR-2026-0101', supplier: savedSuppliers[0], pStatus: BillPaymentStatusEnum.PAID, dateAgo: 22, dueAgo: 10 },
        { billNumber: 'PUR-2026-0102', supplier: savedSuppliers[1], pStatus: BillPaymentStatusEnum.PARTIAL, dateAgo: 15, dueAgo: -5 },
        { billNumber: 'PUR-2026-0103', supplier: savedSuppliers[2], pStatus: BillPaymentStatusEnum.UNPAID, dateAgo: 8, dueAgo: -14 },
        { billNumber: 'PUR-2026-0104', supplier: savedSuppliers[3], pStatus: BillPaymentStatusEnum.UNPAID, dateAgo: 3, dueAgo: -20 },
      ];

      for (const [idx, cfg] of billConfigs.entries()) {
        const lineProducts = [products[(idx + 2) % products.length], products[(idx + 3) % products.length]];
        let total = 0;
        let totalItems = 0;

        const lines: BillLineEntity[] = [];
        for (let lIdx = 0; lIdx < lineProducts.length; lIdx++) {
          const p = lineProducts[lIdx];
          const qty = 15 + lIdx * 10;
          const cost = Number(p.costPrice) || 550;
          const lineTotal = qty * cost;
          total += lineTotal;
          totalItems += qty;

          lines.push(
            billLineRepo.create({
              storeId,
              productId: p.id,
              productName: p.name,
              sku: p.sku || `SKU-B-${idx}-${lIdx}`,
              quantity: qty,
              unitCost: String(cost),
              lineTotal: String(lineTotal),
              lineOrder: lIdx,
            }),
          );
        }

        const paid =
          cfg.pStatus === BillPaymentStatusEnum.PAID
            ? total
            : cfg.pStatus === BillPaymentStatusEnum.PARTIAL
              ? Math.floor(total * 0.4)
              : 0;

        const bill = await billRepo.save(
          billRepo.create({
            tenantId,
            storeId,
            billNumber: cfg.billNumber,
            supplierInvoiceNo: `INV-SUPP-${1000 + idx}`,
            supplierId: cfg.supplier.id,
            supplierName: cfg.supplier.name,
            billDate: daysAgo(cfg.dateAgo),
            dueDate: daysAgo(cfg.dueAgo),
            subtotal: String(total),
            totalAmount: String(total),
            paidAmount: String(paid),
            itemsCount: totalItems,
            paymentStatus: cfg.pStatus,
            status: BillStatusEnum.OPEN,
            notes: 'Vendor goods delivered and accepted in warehouse.',
            createdByUserId: actorId,
            lines,
          }),
        );

        if (paid > 0) {
          await paymentRepo.save(
            paymentRepo.create({
              tenantId,
              storeId,
              paymentNumber: `SPAY-2026-000${idx + 1}`,
              supplierId: cfg.supplier.id,
              supplierName: cfg.supplier.name,
              billId: bill.id,
              paymentDate: daysAgo(cfg.dateAgo - 2),
              amount: String(paid),
              method: idx % 2 === 0 ? SupplierPaymentMethodEnum.BANK_TRANSFER : SupplierPaymentMethodEnum.CASH,
              reference: `TXN-REF-${88000 + idx}`,
              notes: 'Settlement payment for vendor bill.',
              createdByUserId: actorId,
            }),
          );
        }
      }
      console.log(`✅ Seeded ${billConfigs.length} purchase bills & payments.`);
    }

    // ─────────────────────────────────────────────────────────────
    // 4. FINANCE MODULE SEED
    // ─────────────────────────────────────────────────────────────
    console.log('💳 Checking/Seeding Finance Module...');
    let finSetting = await finSettingRepo.findOne({ where: { storeId } });
    if (!finSetting) {
      finSetting = await finSettingRepo.save(
        finSettingRepo.create({
          tenantId,
          storeId,
          currency: 'BDT',
          currencySymbol: '৳',
          defaultTaxRate: '5.00',
          taxNumber: 'BIN-18293849102',
          invoicePrefix: 'INV-',
          billPrefix: 'BILL-',
          invoiceFooterNote: 'Thank you for your business! Payment is due within 15 days.',
          invoiceTerms: 'Late payments are subject to a 2% monthly interest fee.',
        }),
      );
    }

    const demoFinAccountsData = [
      { name: 'Main Cash Drawer', type: FinanceAccountTypeEnum.CASH, bal: '45000.00', num: 'CASH-01', provider: 'Store Register', isDef: true },
      { name: 'DBBL Corporate Account', type: FinanceAccountTypeEnum.BANK, bal: '385000.00', num: '1151200084931', provider: 'Dutch-Bangla Bank', isDef: false },
      { name: 'bKash Merchant Wallet', type: FinanceAccountTypeEnum.DIGITAL_WALLET, bal: '120500.00', num: '01711009988', provider: 'bKash Ltd', isDef: false },
      { name: 'Nagad Merchant Wallet', type: FinanceAccountTypeEnum.DIGITAL_WALLET, bal: '65200.00', num: '01811223344', provider: 'Nagad Postal', isDef: false },
      { name: 'City Bank Master Account', type: FinanceAccountTypeEnum.BANK, bal: '240000.00', num: '3102948291001', provider: 'City Bank PLC', isDef: false },
    ];

    const finAccountMap = new Map<string, FinanceAccountEntity>();
    for (const a of demoFinAccountsData) {
      let acc = await finAccountRepo.findOne({ where: { storeId, name: a.name } });
      if (!acc) {
        acc = await finAccountRepo.save(
          finAccountRepo.create({
            tenantId,
            storeId,
            name: a.name,
            type: a.type,
            accountNumber: a.num,
            bankOrProviderName: a.provider,
            currency: 'BDT',
            startingBalance: a.bal,
            currentBalance: a.bal,
            isDefault: a.isDef,
            isActive: true,
            notes: 'Primary operating account.',
          }),
        );
      }
      finAccountMap.set(a.name, acc);
    }

    const demoFinCatsData = [
      { name: 'Sales Revenue', code: 'SALES_REV', type: FinanceCategoryTypeEnum.INCOME, color: '#10B981' },
      { name: 'Wholesale Income', code: 'WHOLESALE_INC', type: FinanceCategoryTypeEnum.INCOME, color: '#059669' },
      { name: 'Consulting & Services', code: 'SERVICES_INC', type: FinanceCategoryTypeEnum.INCOME, color: '#3B82F6' },
      { name: 'Office Rent', code: 'RENT_EXP', type: FinanceCategoryTypeEnum.EXPENSE, color: '#EF4444' },
      { name: 'Staff Salaries & Wages', code: 'SALARY_EXP', type: FinanceCategoryTypeEnum.EXPENSE, color: '#F97316' },
      { name: 'Logistics & Courier', code: 'COURIER_EXP', type: FinanceCategoryTypeEnum.EXPENSE, color: '#8B5CF6' },
      { name: 'Digital Advertising', code: 'ADS_EXP', type: FinanceCategoryTypeEnum.EXPENSE, color: '#EC4899' },
      { name: 'Packaging & Bags', code: 'PACKAGING_EXP', type: FinanceCategoryTypeEnum.EXPENSE, color: '#6366F1' },
      { name: 'Utilities (Electricity/Net)', code: 'UTILITY_EXP', type: FinanceCategoryTypeEnum.EXPENSE, color: '#14B8A6' },
      { name: 'Software Subscriptions', code: 'SAAS_EXP', type: FinanceCategoryTypeEnum.EXPENSE, color: '#64748B' },
    ];

    const finCatMap = new Map<string, FinanceCategoryEntity>();
    for (const c of demoFinCatsData) {
      let cat = await finCatRepo.findOne({ where: { storeId, code: c.code } });
      if (!cat) {
        cat = await finCatRepo.save(
          finCatRepo.create({
            tenantId,
            storeId,
            name: c.name,
            code: c.code,
            type: c.type,
            color: c.color,
            isSystem: true,
            description: `Finance category for ${c.name}`,
          }),
        );
      }
      finCatMap.set(c.code, cat);
    }

    const existingFinInvoices = await finInvRepo.count({ where: { storeId } });
    if (existingFinInvoices === 0) {
      const invConfigs = [
        { num: 'INV-2026-0001', cust: 'Tanvir Ahmed', email: 'tanvir@gmail.com', phone: '+8801711112233', status: FinanceInvoiceStatusEnum.PAID, dateAgo: 24, total: 18500, paid: 18500 },
        { num: 'INV-2026-0002', cust: 'Shamsul Huda', email: 'shamsul@dhakatech.com', phone: '+8801811223344', status: FinanceInvoiceStatusEnum.PARTIALLY_PAID, dateAgo: 14, total: 32000, paid: 15000 },
        { num: 'INV-2026-0003', cust: 'Ayesha Siddiqua', email: 'ayesha@lifestyle.bd', phone: '+8801911334455', status: FinanceInvoiceStatusEnum.UNPAID, dateAgo: 6, total: 12400, paid: 0 },
        { num: 'INV-2026-0004', cust: 'Rahim Chowdhury', email: 'rahim@retailbd.com', phone: '+8801611445566', status: FinanceInvoiceStatusEnum.OVERDUE, dateAgo: 35, total: 26500, paid: 0 },
        { num: 'INV-2026-0005', cust: 'Mehedi Hasan', email: 'mehedi@corp.com', phone: '+8801511556677', status: FinanceInvoiceStatusEnum.DRAFT, dateAgo: 1, total: 8900, paid: 0 },
      ];

      for (const [idx, cfg] of invConfigs.entries()) {
        const subtotal = Math.round(cfg.total / 1.05);
        const tax = cfg.total - subtotal;
        const due = cfg.total - cfg.paid;

        const items = [
          finInvItemRepo.create({
            title: products[idx % products.length]?.name || 'Retail Wholesale Batch',
            description: 'Standard product bundle shipment',
            quantity: 5,
            unitPrice: String(Math.round(subtotal / 5)),
            taxRate: '5.00',
            totalAmount: String(subtotal),
          }),
        ];

        await finInvRepo.save(
          finInvRepo.create({
            tenantId,
            storeId,
            invoiceNumber: cfg.num,
            customerName: cfg.cust,
            customerEmail: cfg.email,
            customerPhone: cfg.phone,
            customerAddress: 'House 42, Road 11, Banani, Dhaka',
            issueDate: daysAgo(cfg.dateAgo),
            dueDate: daysAgo(cfg.dateAgo - 14),
            subtotal: String(subtotal),
            taxAmount: String(tax),
            discountAmount: '0.00',
            totalAmount: String(cfg.total),
            paidAmount: String(cfg.paid),
            balanceDue: String(due),
            currency: 'BDT',
            status: cfg.status,
            notes: 'Thank you for choosing us!',
            terms: 'Net 14 days payment.',
            createdByUserId: actorId,
            items,
          }),
        );
      }
      console.log(`✅ Seeded ${invConfigs.length} finance invoices.`);
    }

    const existingFinBills = await finBillRepo.count({ where: { storeId } });
    if (existingFinBills === 0) {
      const billConfigs = [
        { num: 'BILL-2026-0001', supp: 'ABC Wholesale Ltd.', cat: 'RAW_MATERIALS', total: 42000, paid: 42000, status: FinanceBillStatusEnum.PAID, dateAgo: 25 },
        { num: 'BILL-2026-0002', supp: 'Desh Courier Ltd.', cat: 'COURIER_EXP', total: 18500, paid: 10000, status: FinanceBillStatusEnum.PARTIALLY_PAID, dateAgo: 16 },
        { num: 'BILL-2026-0003', supp: 'Apex Packaging Industries', cat: 'PACKAGING_EXP', total: 9800, paid: 0, status: FinanceBillStatusEnum.UNPAID, dateAgo: 8 },
        { num: 'BILL-2026-0004', supp: 'Dhaka City Properties', cat: 'RENT_EXP', total: 35000, paid: 35000, status: FinanceBillStatusEnum.PAID, dateAgo: 30 },
      ];

      for (const [idx, cfg] of billConfigs.entries()) {
        const subtotal = Math.round(cfg.total / 1.05);
        const tax = cfg.total - subtotal;
        const due = cfg.total - cfg.paid;

        const items = [
          finBillItemRepo.create({
            title: `${cfg.supp} - Supplies Batch ${idx + 1}`,
            description: 'Monthly business operating expense item',
            quantity: 1,
            unitPrice: String(subtotal),
            taxRate: '5.00',
            totalAmount: String(subtotal),
          }),
        ];

        await finBillRepo.save(
          finBillRepo.create({
            tenantId,
            storeId,
            billNumber: cfg.num,
            supplierName: cfg.supp,
            supplierContact: '+880 1700-112233',
            supplierEmail: 'billing@vendor.com',
            category: cfg.cat,
            issueDate: daysAgo(cfg.dateAgo),
            dueDate: daysAgo(cfg.dateAgo - 15),
            subtotal: String(subtotal),
            taxAmount: String(tax),
            totalAmount: String(cfg.total),
            paidAmount: String(cfg.paid),
            balanceDue: String(due),
            currency: 'BDT',
            status: cfg.status,
            notes: 'Verified against PO and delivery challan.',
            createdByUserId: actorId,
            items,
          }),
        );
      }
      console.log(`✅ Seeded ${billConfigs.length} finance bills.`);
    }

    const existingFinTx = await finTxRepo.count({ where: { storeId } });
    if (existingFinTx === 0) {
      const primaryBank = finAccountMap.get('DBBL Corporate Account');
      const cashAcc = finAccountMap.get('Main Cash Drawer');
      const bkashAcc = finAccountMap.get('bKash Merchant Wallet');

      const txConfigs = [
        { num: 'TXN-2026-0001', type: FinanceTransactionTypeEnum.INCOME, amt: '28500.00', acc: bkashAcc, cat: finCatMap.get('SALES_REV'), desc: 'Daily bKash online orders settlement', dateAgo: 1, src: FinanceSourceTypeEnum.ORDER },
        { num: 'TXN-2026-0002', type: FinanceTransactionTypeEnum.INCOME, amt: '45000.00', acc: primaryBank, cat: finCatMap.get('WHOLESALE_INC'), desc: 'Corporate bulk order payment', dateAgo: 3, src: FinanceSourceTypeEnum.INVOICE },
        { num: 'TXN-2026-0003', type: FinanceTransactionTypeEnum.EXPENSE, amt: '35000.00', acc: primaryBank, cat: finCatMap.get('RENT_EXP'), desc: 'Monthly store showroom & office rent', dateAgo: 5, src: FinanceSourceTypeEnum.MANUAL },
        { num: 'TXN-2026-0004', type: FinanceTransactionTypeEnum.EXPENSE, amt: '14200.00', acc: primaryBank, cat: finCatMap.get('ADS_EXP'), desc: 'Facebook & Google Ad spend campaign', dateAgo: 7, src: FinanceSourceTypeEnum.MANUAL },
        { num: 'TXN-2026-0005', type: FinanceTransactionTypeEnum.INCOME, amt: '18500.00', acc: cashAcc, cat: finCatMap.get('SALES_REV'), desc: 'Store cash register sales collection', dateAgo: 8, src: FinanceSourceTypeEnum.MANUAL },
        { num: 'TXN-2026-0006', type: FinanceTransactionTypeEnum.EXPENSE, amt: '8400.00', acc: cashAcc, cat: finCatMap.get('UTILITY_EXP'), desc: 'Electricity and DESCO utility bill', dateAgo: 10, src: FinanceSourceTypeEnum.MANUAL },
        { num: 'TXN-2026-0007', type: FinanceTransactionTypeEnum.EXPENSE, amt: '22000.00', acc: primaryBank, cat: finCatMap.get('SALARY_EXP'), desc: 'Staff advance payroll compensation', dateAgo: 12, src: FinanceSourceTypeEnum.PAYROLL },
        { num: 'TXN-2026-0008', type: FinanceTransactionTypeEnum.INCOME, amt: '36000.00', acc: bkashAcc, cat: finCatMap.get('SALES_REV'), desc: 'Steadfast courier COD remittance', dateAgo: 15, src: FinanceSourceTypeEnum.ORDER },
        { num: 'TXN-2026-0009', type: FinanceTransactionTypeEnum.EXPENSE, amt: '6500.00', acc: bkashAcc, cat: finCatMap.get('PACKAGING_EXP'), desc: 'Poly bags and branded carton tape purchase', dateAgo: 18, src: FinanceSourceTypeEnum.BILL },
        { num: 'TXN-2026-0010', type: FinanceTransactionTypeEnum.INCOME, amt: '15000.00', acc: primaryBank, cat: finCatMap.get('SERVICES_INC'), desc: 'Custom branding & embroidery service fee', dateAgo: 22, src: FinanceSourceTypeEnum.MANUAL },
      ];

      for (const t of txConfigs) {
        await finTxRepo.save(
          finTxRepo.create({
            tenantId,
            storeId,
            transactionNumber: t.num,
            type: t.type,
            amount: t.amt,
            currency: 'BDT',
            transactionDate: daysAgo(t.dateAgo),
            accountId: t.acc?.id,
            categoryId: t.cat?.id,
            categoryCode: t.cat?.code,
            description: t.desc,
            reference: `REF-${t.num}`,
            sourceType: t.src,
            paymentMethod: t.acc?.type === FinanceAccountTypeEnum.CASH ? 'CASH' : 'BANK_TRANSFER',
            status: FinanceTransactionStatusEnum.COMPLETED,
            createdByUserId: actorId,
          }),
        );
      }

      if (bkashAcc && primaryBank) {
        await finTransferRepo.save(
          finTransferRepo.create({
            tenantId,
            storeId,
            transferNumber: 'TRF-2026-0001',
            fromAccountId: bkashAcc.id,
            toAccountId: primaryBank.id,
            amount: '50000.00',
            fee: '75.00',
            currency: 'BDT',
            transferDate: daysAgo(4),
            reference: 'BKASH-DISBURSE-9921',
            notes: 'Transfer bKash collection to main bank account.',
            status: FinanceTransferStatusEnum.COMPLETED,
            createdByUserId: actorId,
          }),
        );
      }
      console.log(`✅ Seeded ${txConfigs.length} finance transactions & account transfer.`);
    }

    console.log(`🎉 Store "${store.name}" successfully seeded with all demo data!`);
  }

  await AppDataSource.destroy();
  console.log('\n🌟 All stores successfully populated with Accounting, Purchase, and Finance demo data.');
}

run().catch((err) => {
  console.error('❌ Seeder encountered an error:', err);
  process.exit(1);
});
