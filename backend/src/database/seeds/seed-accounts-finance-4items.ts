import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../data-source';
import { StoreEntity } from '../../modules/tenant/entities/store.entity';
import { UserEntity, UserRoleEnum } from '../../modules/user/entities/user.entity';

import { FinanceAccountEntity } from '../../modules/finance/entities/finance-account.entity';
import { FinanceCategoryEntity } from '../../modules/finance/entities/finance-category.entity';
import { FinanceTransactionEntity } from '../../modules/finance/entities/finance-transaction.entity';
import { FinanceInvoiceEntity } from '../../modules/finance/entities/finance-invoice.entity';
import { FinanceInvoiceItemEntity } from '../../modules/finance/entities/finance-invoice-item.entity';
import { FinanceBillEntity } from '../../modules/finance/entities/finance-bill.entity';
import { FinanceBillItemEntity } from '../../modules/finance/entities/finance-bill-item.entity';
import { FinanceRequisitionEntity } from '../../modules/finance/entities/finance-requisition.entity';
import { FinanceTransferEntity } from '../../modules/finance/entities/finance-transfer.entity';
import { FinanceSettingEntity } from '../../modules/finance/entities/finance-setting.entity';
import { FinanceChartOfAccountEntity } from '../../modules/finance/entities/finance-chart-of-account.entity';
import { FinanceJournalEntryEntity } from '../../modules/finance/entities/finance-journal-entry.entity';
import { FinanceJournalLineEntity } from '../../modules/finance/entities/finance-journal-line.entity';

import {
  FinanceAccountTypeEnum,
  FinanceCategoryTypeEnum,
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceSourceTypeEnum,
  FinanceInvoiceStatusEnum,
  FinanceBillStatusEnum,
  FinanceRequisitionStatusEnum,
  FinanceRequisitionPriorityEnum,
  FinanceTransferStatusEnum,
  FinanceAccountClassEnum,
  FinanceNormalBalanceEnum,
  FinanceLineTypeEnum,
  FinanceJournalStatusEnum,
  FinanceJournalEntryTypeEnum,
  FinancePartyTypeEnum,
} from '../../modules/finance/enums/finance.enums';

export async function runAccountsFinance4ItemsSeed() {
  console.log('🚀 Initializing DB Connection for 4-Item Testing Data Seed...');
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  console.log('✅ Connected to database.');

  const storeRepo = AppDataSource.getRepository(StoreEntity);
  const userRepo = AppDataSource.getRepository(UserEntity);

  const finAccountRepo = AppDataSource.getRepository(FinanceAccountEntity);
  const finCatRepo = AppDataSource.getRepository(FinanceCategoryEntity);
  const finTxRepo = AppDataSource.getRepository(FinanceTransactionEntity);
  const finInvRepo = AppDataSource.getRepository(FinanceInvoiceEntity);
  const finInvItemRepo = AppDataSource.getRepository(FinanceInvoiceItemEntity);
  const finBillRepo = AppDataSource.getRepository(FinanceBillEntity);
  const finBillItemRepo = AppDataSource.getRepository(FinanceBillItemEntity);
  const finReqRepo = AppDataSource.getRepository(FinanceRequisitionEntity);
  const finTransferRepo = AppDataSource.getRepository(FinanceTransferEntity);
  const finSettingRepo = AppDataSource.getRepository(FinanceSettingEntity);
  const finCoaRepo = AppDataSource.getRepository(FinanceChartOfAccountEntity);
  const finJeRepo = AppDataSource.getRepository(FinanceJournalEntryEntity);
  const finJlRepo = AppDataSource.getRepository(FinanceJournalLineEntity);

  const stores = await storeRepo.find();
  if (stores.length === 0) {
    console.error('❌ No stores found in the database. Run initial store seed first.');
    return;
  }

  const defaultUser =
    (await userRepo.findOne({ where: { role: UserRoleEnum.SUPER_ADMIN } })) ||
    (await userRepo.findOne({ where: {} }));
  const actorId = defaultUser?.id ?? '00000000-0000-0000-0000-000000000000';

  for (const store of stores) {
    console.log(`\n======================================================`);
    console.log(`🏪 Resetting & Seeding Store: "${store.name}" (${store.id})`);
    console.log(`======================================================`);

    const tenantId = store.tenantId;
    const storeId = store.id;

    // ─────────────────────────────────────────────────────────────
    // 1. CLEAN EXISTING FINANCE RECORDS FOR THIS STORE
    // ─────────────────────────────────────────────────────────────
    console.log('🧹 Clearing previous finance & accounting data for clean 4-item setup...');
    await finTxRepo.delete({ storeId });
    await finTransferRepo.delete({ storeId });
    await finJlRepo.delete({ storeId });
    await finJeRepo.delete({ storeId });
    await finInvRepo.delete({ storeId });
    await finBillRepo.delete({ storeId });
    await finReqRepo.delete({ storeId });
    await finAccountRepo.delete({ storeId });
    await finCoaRepo.delete({ storeId });
    await finCatRepo.delete({ storeId });
    console.log('✨ All old finance records cleared.');

    // ─────────────────────────────────────────────────────────────
    // 2. ENSURE FINANCE SETTINGS
    // ─────────────────────────────────────────────────────────────
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
          invoiceTerms: 'Net 14 days standard payment.',
        }),
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 3. SEED EXACTLY 4 ACCOUNTS (50,000 TK EACH)
    // ─────────────────────────────────────────────────────────────
    console.log('💳 Seeding exactly 4 accounts with ৳50,000.00 each...');
    const accountConfigs = [
      {
        name: 'Dutch-Bangla Bank Corporate',
        type: FinanceAccountTypeEnum.BANK,
        accountNumber: '1151200084931',
        bankOrProviderName: 'Dutch-Bangla Bank PLC',
        isDefault: true,
        notes: 'Primary business operating bank account.',
      },
      {
        name: 'City Bank Visa Platinum Card',
        type: FinanceAccountTypeEnum.CARD,
        accountNumber: '4111222233334444',
        bankOrProviderName: 'City Bank PLC',
        isDefault: false,
        notes: 'Corporate debit card for vendor ad spend and digital payments.',
      },
      {
        name: 'bKash Merchant Wallet',
        type: FinanceAccountTypeEnum.DIGITAL_WALLET,
        accountNumber: '01711009988',
        bankOrProviderName: 'bKash Ltd',
        isDefault: false,
        notes: 'Official merchant MFS collection wallet.',
      },
      {
        name: 'Main Store Cash Vault',
        type: FinanceAccountTypeEnum.CASH,
        accountNumber: 'CASH-DRAWER',
        bankOrProviderName: 'Store Cash Register',
        isDefault: false,
        notes: 'Physical cash drawer in showroom.',
      },
    ];

    const savedAccounts: FinanceAccountEntity[] = [];
    for (const a of accountConfigs) {
      const acc = await finAccountRepo.save(
        finAccountRepo.create({
          tenantId,
          storeId,
          name: a.name,
          type: a.type,
          accountNumber: a.accountNumber,
          bankOrProviderName: a.bankOrProviderName,
          currency: 'BDT',
          startingBalance: '50000.00',
          currentBalance: '50000.00',
          isDefault: a.isDefault,
          isActive: true,
          notes: a.notes,
        }),
      );
      savedAccounts.push(acc as FinanceAccountEntity);
    }
    console.log(`✅ Seeded ${savedAccounts.length} accounts with ৳50,000 each (Total: ৳200,000).`);

    const dbblBank = savedAccounts[0];
    const cityCard = savedAccounts[1];
    const bkashWallet = savedAccounts[2];
    const cashVault = savedAccounts[3];

    // ─────────────────────────────────────────────────────────────
    // 4. SEED EXACTLY 4 FINANCE CATEGORIES
    // ─────────────────────────────────────────────────────────────
    console.log('🏷️ Seeding 4 finance categories...');
    const catConfigs = [
      { name: 'Sales Revenue', code: 'SALES_REV', type: FinanceCategoryTypeEnum.INCOME, color: '#10B981' },
      { name: 'Office & Showroom Rent', code: 'RENT_EXP', type: FinanceCategoryTypeEnum.EXPENSE, color: '#EF4444' },
      { name: 'Digital Marketing & Ads', code: 'ADS_EXP', type: FinanceCategoryTypeEnum.EXPENSE, color: '#EC4899' },
      { name: 'Packaging & Boxes', code: 'PACKAGING_EXP', type: FinanceCategoryTypeEnum.EXPENSE, color: '#6366F1' },
    ];

    const savedCategories: FinanceCategoryEntity[] = [];
    for (const c of catConfigs) {
      const cat = await finCatRepo.save(
        finCatRepo.create({
          tenantId,
          storeId,
          name: c.name,
          code: c.code,
          type: c.type,
          color: c.color,
          isSystem: true,
          description: `Operational category for ${c.name}`,
        }),
      );
      savedCategories.push(cat as FinanceCategoryEntity);
    }
    console.log(`✅ Seeded ${savedCategories.length} categories.`);

    // ─────────────────────────────────────────────────────────────
    // 5. SEED EXACTLY 4 TRANSACTIONS
    // ─────────────────────────────────────────────────────────────
    console.log('💸 Seeding 4 finance transactions...');
    const txConfigs = [
      {
        num: 'TXN-2026-0001',
        type: FinanceTransactionTypeEnum.INCOME,
        amt: '12500.00',
        acc: bkashWallet,
        cat: savedCategories[0],
        desc: 'Daily bKash online orders settlement',
        date: '2026-09-18',
        src: FinanceSourceTypeEnum.ORDER,
        method: 'DIGITAL_WALLET',
      },
      {
        num: 'TXN-2026-0002',
        type: FinanceTransactionTypeEnum.INCOME,
        amt: '25000.00',
        acc: dbblBank,
        cat: savedCategories[0],
        desc: 'Wholesale corporate client wire payment',
        date: '2026-09-15',
        src: FinanceSourceTypeEnum.INVOICE,
        method: 'BANK_TRANSFER',
      },
      {
        num: 'TXN-2026-0003',
        type: FinanceTransactionTypeEnum.EXPENSE,
        amt: '15000.00',
        acc: cityCard,
        cat: savedCategories[1],
        desc: 'Monthly showroom & retail outlet space rent',
        date: '2026-09-12',
        src: FinanceSourceTypeEnum.MANUAL,
        method: 'CARD',
      },
      {
        num: 'TXN-2026-0004',
        type: FinanceTransactionTypeEnum.EXPENSE,
        amt: '4500.00',
        acc: cashVault,
        cat: savedCategories[3],
        desc: 'Corrugated courier packing boxes & bubble wrap',
        date: '2026-09-08',
        src: FinanceSourceTypeEnum.MANUAL,
        method: 'CASH',
      },
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
          transactionDate: t.date,
          accountId: t.acc.id,
          categoryId: t.cat.id,
          categoryCode: t.cat.code,
          description: t.desc,
          reference: `REF-${t.num}`,
          sourceType: t.src,
          paymentMethod: t.method,
          status: FinanceTransactionStatusEnum.COMPLETED,
          createdByUserId: actorId,
        }),
      );
    }
    console.log(`✅ Seeded ${txConfigs.length} transactions.`);

    // ─────────────────────────────────────────────────────────────
    // 6. SEED EXACTLY 4 INVOICES
    // ─────────────────────────────────────────────────────────────
    console.log('📄 Seeding 4 customer invoices...');
    const invConfigs = [
      {
        num: 'INV-2026-0001',
        cust: 'Tanvir Ahmed',
        email: 'tanvir@gmail.com',
        phone: '+8801711112233',
        status: FinanceInvoiceStatusEnum.PAID,
        issueDate: '2026-09-02',
        dueDate: '2026-09-16',
        total: 18500,
        paid: 18500,
      },
      {
        num: 'INV-2026-0002',
        cust: 'Dhaka Tech Corp',
        email: 'info@dhakatech.com',
        phone: '+8801811223344',
        status: FinanceInvoiceStatusEnum.PARTIALLY_PAID,
        issueDate: '2026-09-05',
        dueDate: '2026-09-19',
        total: 32000,
        paid: 15000,
      },
      {
        num: 'INV-2026-0003',
        cust: 'Ayesha Siddiqua',
        email: 'ayesha@lifestyle.bd',
        phone: '+8801911334455',
        status: FinanceInvoiceStatusEnum.UNPAID,
        issueDate: '2026-09-12',
        dueDate: '2026-09-26',
        total: 14200,
        paid: 0,
      },
      {
        num: 'INV-2026-0004',
        cust: 'Rahim Enterprise',
        email: 'rahim@retailbd.com',
        phone: '+8801611445566',
        status: FinanceInvoiceStatusEnum.OVERDUE,
        issueDate: '2026-08-15',
        dueDate: '2026-08-30',
        total: 22000,
        paid: 0,
      },
    ];

    for (const [idx, cfg] of invConfigs.entries()) {
      const subtotal = Math.round(cfg.total / 1.05);
      const tax = cfg.total - subtotal;
      const due = cfg.total - cfg.paid;

      const items = [
        finInvItemRepo.create({
          title: `Corporate Apparel & Merchandise Package ${idx + 1}`,
          description: 'Premium branded apparel order with delivery',
          quantity: 4,
          unitPrice: String(Math.round(subtotal / 4)),
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
          customerAddress: 'House 14, Road 7, Dhanmondi, Dhaka',
          issueDate: cfg.issueDate,
          dueDate: cfg.dueDate,
          subtotal: String(subtotal),
          taxAmount: String(tax),
          discountAmount: '0.00',
          totalAmount: String(cfg.total),
          paidAmount: String(cfg.paid),
          balanceDue: String(due),
          currency: 'BDT',
          status: cfg.status,
          notes: 'Thank you for your valued business partnership!',
          terms: 'Net 14 days invoice terms.',
          createdByUserId: actorId,
          items,
        }),
      );
    }
    console.log(`✅ Seeded ${invConfigs.length} customer invoices.`);

    // ─────────────────────────────────────────────────────────────
    // 7. SEED EXACTLY 4 BILLS
    // ─────────────────────────────────────────────────────────────
    console.log('🧾 Seeding 4 supplier bills...');
    const billConfigs = [
      {
        num: 'BILL-2026-0001',
        supp: 'ABC Wholesale Ltd.',
        cat: 'RAW_MATERIALS',
        total: 25000,
        paid: 25000,
        status: FinanceBillStatusEnum.PAID,
        issueDate: '2026-09-03',
        dueDate: '2026-09-17',
      },
      {
        num: 'BILL-2026-0002',
        supp: 'Desh Courier Logistics',
        cat: 'COURIER_EXP',
        total: 18000,
        paid: 10000,
        status: FinanceBillStatusEnum.PARTIALLY_PAID,
        issueDate: '2026-09-07',
        dueDate: '2026-09-21',
      },
      {
        num: 'BILL-2026-0003',
        supp: 'Apex Packaging Box Ltd.',
        cat: 'PACKAGING_EXP',
        total: 8500,
        paid: 0,
        status: FinanceBillStatusEnum.UNPAID,
        issueDate: '2026-09-14',
        dueDate: '2026-09-28',
      },
      {
        num: 'BILL-2026-0004',
        supp: 'Power & Utility Services',
        cat: 'UTILITY_EXP',
        total: 12000,
        paid: 0,
        status: FinanceBillStatusEnum.OVERDUE,
        issueDate: '2026-08-18',
        dueDate: '2026-09-02',
      },
    ];

    for (const [idx, cfg] of billConfigs.entries()) {
      const subtotal = Math.round(cfg.total / 1.05);
      const tax = cfg.total - subtotal;
      const due = cfg.total - cfg.paid;

      const items = [
        finBillItemRepo.create({
          title: `${cfg.supp} - Supply Delivery Batch ${idx + 1}`,
          description: 'Official verified delivery and supplier invoice',
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
          issueDate: cfg.issueDate,
          dueDate: cfg.dueDate,
          subtotal: String(subtotal),
          taxAmount: String(tax),
          totalAmount: String(cfg.total),
          paidAmount: String(cfg.paid),
          balanceDue: String(due),
          currency: 'BDT',
          status: cfg.status,
          notes: 'Supplier bill received and audited.',
          createdByUserId: actorId,
          items,
        }),
      );
    }
    console.log(`✅ Seeded ${billConfigs.length} supplier bills.`);

    // ─────────────────────────────────────────────────────────────
    // 8. SEED EXACTLY 4 REQUISITIONS (2 PENDING FOR APPROVALS)
    // ─────────────────────────────────────────────────────────────
    console.log('📋 Seeding 4 finance requisitions...');
    const reqConfigs = [
      {
        num: 'REQ-2026-0001',
        title: 'Spring Fabric Restock & Yarn Batch',
        category: 'PURCHASE',
        amount: '35000.00',
        status: FinanceRequisitionStatusEnum.APPROVED,
        priority: FinanceRequisitionPriorityEnum.HIGH,
        reqDate: '2026-09-04',
        supplier: 'ABC Wholesale Ltd.',
      },
      {
        num: 'REQ-2026-0002',
        title: 'Digital Marketing & Social Ad Campaign',
        category: 'MARKETING',
        amount: '18500.00',
        status: FinanceRequisitionStatusEnum.PENDING,
        priority: FinanceRequisitionPriorityEnum.NORMAL,
        reqDate: '2026-09-10',
        supplier: 'Meta Ads Agency',
      },
      {
        num: 'REQ-2026-0003',
        title: 'Showroom Display Fixtures & Lighting',
        category: 'OPERATIONS',
        amount: '12000.00',
        status: FinanceRequisitionStatusEnum.PENDING,
        priority: FinanceRequisitionPriorityEnum.NORMAL,
        reqDate: '2026-09-14',
        supplier: 'Dhaka Fixtures Ltd.',
      },
      {
        num: 'REQ-2026-0004',
        title: 'Executive Ergonomic Mesh Chairs',
        category: 'OFFICE_SUPPLIES',
        amount: '8000.00',
        status: FinanceRequisitionStatusEnum.REJECTED,
        priority: FinanceRequisitionPriorityEnum.LOW,
        reqDate: '2026-09-16',
        supplier: 'Hatil Furnishings',
      },
    ];

    for (const r of reqConfigs) {
      await finReqRepo.save(
        finReqRepo.create({
          tenantId,
          storeId,
          requisitionNumber: r.num,
          title: r.title,
          category: r.category,
          requestedAmount: r.amount,
          requestDate: r.reqDate,
          supplierName: r.supplier,
          priority: r.priority,
          status: r.status,
          notes: `Official staff requisition for ${r.title}`,
          createdByUserId: actorId,
          createdByName: 'Admin User',
          items: [
            {
              productName: r.title,
              quantity: 1,
              unitCost: Number(r.amount),
              lineTotal: Number(r.amount),
            },
          ],
        }),
      );
    }
    console.log(`✅ Seeded ${reqConfigs.length} requisitions.`);

    // ─────────────────────────────────────────────────────────────
    // 9. SEED EXACTLY 4 FUND TRANSFERS
    // ─────────────────────────────────────────────────────────────
    console.log('🔄 Seeding 4 account fund transfers...');
    const transferConfigs = [
      {
        num: 'TRF-2026-0001',
        from: bkashWallet,
        to: dbblBank,
        amt: '20000.00',
        fee: '30.00',
        date: '2026-09-10',
        ref: 'BKASH-DISBURSE-101',
        notes: 'Transfer bKash collections to primary bank account',
        status: FinanceTransferStatusEnum.COMPLETED,
      },
      {
        num: 'TRF-2026-0002',
        from: cashVault,
        to: dbblBank,
        amt: '15000.00',
        fee: '0.00',
        date: '2026-09-12',
        ref: 'VAULT-DEPOSIT-202',
        notes: 'End of week cash vault deposit to bank',
        status: FinanceTransferStatusEnum.COMPLETED,
      },
      {
        num: 'TRF-2026-0003',
        from: dbblBank,
        to: cityCard,
        amt: '10000.00',
        fee: '0.00',
        date: '2026-09-15',
        ref: 'CARD-TOPUP-303',
        notes: 'Pre-fund corporate visa debit card for upcoming campaigns',
        status: FinanceTransferStatusEnum.COMPLETED,
      },
      {
        num: 'TRF-2026-0004',
        from: dbblBank,
        to: bkashWallet,
        amt: '5000.00',
        fee: '15.00',
        date: '2026-09-18',
        ref: 'BKASH-FLOAT-404',
        notes: 'Refill bKash wallet float for customer instant refunds',
        status: FinanceTransferStatusEnum.COMPLETED,
      },
    ];

    for (const tr of transferConfigs) {
      await finTransferRepo.save(
        finTransferRepo.create({
          tenantId,
          storeId,
          transferNumber: tr.num,
          fromAccountId: tr.from.id,
          toAccountId: tr.to.id,
          amount: tr.amt,
          fee: tr.fee,
          currency: 'BDT',
          transferDate: tr.date,
          reference: tr.ref,
          notes: tr.notes,
          status: tr.status,
          createdByUserId: actorId,
        }),
      );
    }
    console.log(`✅ Seeded ${transferConfigs.length} fund transfers.`);

    // ─────────────────────────────────────────────────────────────
    // 10. SEED EXACTLY 4 CHART OF ACCOUNTS
    // ─────────────────────────────────────────────────────────────
    console.log('📊 Seeding 4 chart of accounts...');
    const coaConfigs = [
      {
        code: '1010',
        name: 'Cash and Bank Equivalents',
        accountClass: FinanceAccountClassEnum.ASSET,
        normalBalance: FinanceNormalBalanceEnum.DEBIT,
        balance: '200000.00',
        desc: 'Liquid operating cash, bank accounts, and wallet reserves',
      },
      {
        code: '1200',
        name: 'Accounts Receivable',
        accountClass: FinanceAccountClassEnum.ASSET,
        normalBalance: FinanceNormalBalanceEnum.DEBIT,
        balance: '53200.00',
        desc: 'Outstanding uncollected customer trade receivables',
      },
      {
        code: '2010',
        name: 'Accounts Payable',
        accountClass: FinanceAccountClassEnum.LIABILITY,
        normalBalance: FinanceNormalBalanceEnum.CREDIT,
        balance: '28500.00',
        desc: 'Unpaid vendor invoices and trade payables obligations',
      },
      {
        code: '4010',
        name: 'Sales & Operating Revenue',
        accountClass: FinanceAccountClassEnum.REVENUE,
        normalBalance: FinanceNormalBalanceEnum.CREDIT,
        balance: '37500.00',
        desc: 'Gross revenue derived from retail sales and customer invoices',
      },
    ];

    const savedCoas: FinanceChartOfAccountEntity[] = [];
    for (const c of coaConfigs) {
      const coa = await finCoaRepo.save(
        finCoaRepo.create({
          tenantId,
          storeId,
          code: c.code,
          name: c.name,
          accountClass: c.accountClass,
          subType: 'OPERATING',
          normalBalance: c.normalBalance,
          currentBalance: c.balance,
          currency: 'BDT',
          description: c.desc,
          isSystem: true,
          isActive: true,
        }),
      );
      savedCoas.push(coa as FinanceChartOfAccountEntity);
    }
    console.log(`✅ Seeded ${savedCoas.length} chart of accounts.`);

    // ─────────────────────────────────────────────────────────────
    // 11. SEED EXACTLY 4 BALANCED JOURNAL ENTRIES
    // ─────────────────────────────────────────────────────────────
    console.log('📖 Seeding 4 balanced journal entries...');
    const coaCash = savedCoas[0];
    const coaAr = savedCoas[1];
    const coaAp = savedCoas[2];
    const coaRev = savedCoas[3];

    const jeConfigs = [
      {
        num: 'JE-2026-0001',
        date: '2026-09-01',
        desc: 'Initial Business Capital & Vault Reserves Infusion',
        amount: '200000.00',
        lines: [
          { account: coaCash, type: FinanceLineTypeEnum.DEBIT, amount: '200000.00', desc: 'Debit: Cash & Bank accounts' },
          { account: coaRev, type: FinanceLineTypeEnum.CREDIT, amount: '200000.00', desc: 'Credit: Initial equity/revenue fund' },
        ],
      },
      {
        num: 'JE-2026-0002',
        date: '2026-09-06',
        desc: 'Bulk Wholesale Order Invoiced to Trade Customer',
        amount: '32000.00',
        lines: [
          { account: coaAr, type: FinanceLineTypeEnum.DEBIT, amount: '32000.00', desc: 'Debit: Customer Receivable' },
          { account: coaRev, type: FinanceLineTypeEnum.CREDIT, amount: '32000.00', desc: 'Credit: Wholesale Sales Revenue' },
        ],
      },
      {
        num: 'JE-2026-0003',
        date: '2026-09-08',
        desc: 'Supplier Merchandise Restock on Credit',
        amount: '20000.00',
        lines: [
          { account: coaCash, type: FinanceLineTypeEnum.DEBIT, amount: '20000.00', desc: 'Debit: Inventory Merchandise Asset' },
          { account: coaAp, type: FinanceLineTypeEnum.CREDIT, amount: '20000.00', desc: 'Credit: Vendor Accounts Payable' },
        ],
      },
      {
        num: 'JE-2026-0004',
        date: '2026-09-12',
        desc: 'Showroom & Retail Outlet Facility Rent Settlement',
        amount: '15000.00',
        lines: [
          { account: coaAp, type: FinanceLineTypeEnum.DEBIT, amount: '15000.00', desc: 'Debit: Operating Rent Expense' },
          { account: coaCash, type: FinanceLineTypeEnum.CREDIT, amount: '15000.00', desc: 'Credit: Cash & Bank Withdrawal' },
        ],
      },
    ];

    for (const j of jeConfigs) {
      const createdJe = finJeRepo.create({
        tenantId,
        storeId,
        entryNumber: j.num,
        entryDate: j.date,
        postingDate: new Date(`${j.date}T10:00:00Z`),
        sourceType: FinanceJournalEntryTypeEnum.MANUAL,
        sourceReference: `REF-${j.num}`,
        description: j.desc,
        totalDebit: j.amount,
        totalCredit: j.amount,
        currency: 'BDT',
        status: FinanceJournalStatusEnum.POSTED,
        isBalanced: true,
        postedByUserId: actorId,
        postedByName: 'Admin User',
        notes: 'Standard posted double-entry journal voucher.',
      });

      const savedJe = (await finJeRepo.save(createdJe)) as FinanceJournalEntryEntity;

      for (let lIdx = 0; lIdx < j.lines.length; lIdx++) {
        const line = j.lines[lIdx];
        await finJlRepo.save(
          finJlRepo.create({
            tenantId,
            storeId,
            journalEntryId: savedJe.id,
            accountId: line.account.id,
            accountCode: line.account.code,
            accountName: line.account.name,
            type: line.type,
            amount: line.amount,
            description: line.desc,
            partyType: FinancePartyTypeEnum.NONE,
          }),
        );
      }
    }
    console.log(`✅ Seeded ${jeConfigs.length} balanced journal entries.`);
  }

  console.log('\n🎉 ALL STORES SUCCESSFULLY POPULATED WITH 4-ITEM CLEAN TESTING DATASET!');
}

if (require.main === module) {
  runAccountsFinance4ItemsSeed()
    .then(async () => {
      await AppDataSource.destroy();
      console.log('🔌 DB Connection closed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error during seeding:', err);
      process.exit(1);
    });
}
