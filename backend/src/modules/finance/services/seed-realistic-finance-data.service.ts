import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { FinanceCategoryEntity } from '../entities/finance-category.entity';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { FinanceInvoiceEntity } from '../entities/finance-invoice.entity';
import { FinanceBillEntity } from '../entities/finance-bill.entity';
import {
  FinanceAccountTypeEnum,
  FinanceCategoryTypeEnum,
  FinanceInvoiceStatusEnum,
  FinanceBillStatusEnum,
  FinanceSourceTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceTransactionTypeEnum,
} from '../enums/finance.enums';

export const REALISTIC_CATEGORIES = [
  { name: 'Product Sales Revenue', code: 'PRODUCT_SALES', type: FinanceCategoryTypeEnum.INCOME, color: '#10b981' },
  { name: 'Shipping & Delivery Income', code: 'SHIPPING_INCOME', type: FinanceCategoryTypeEnum.INCOME, color: '#0ea5e9' },
  { name: 'Wholesale & B2B Revenue', code: 'WHOLESALE_REVENUE', type: FinanceCategoryTypeEnum.INCOME, color: '#6366f1' },
  { name: 'Cost of Goods Sold (COGS)', code: 'COGS', type: FinanceCategoryTypeEnum.EXPENSE, color: '#ef4444' },
  { name: 'Salaries & Payroll', code: 'SALARY', type: FinanceCategoryTypeEnum.EXPENSE, color: '#ec4899' },
  { name: 'Courier & Shipping Fees', code: 'SHIPPING', type: FinanceCategoryTypeEnum.EXPENSE, color: '#84cc16' },
  { name: 'Marketing & Digital Ads', code: 'MARKETING', type: FinanceCategoryTypeEnum.EXPENSE, color: '#f59e0b' },
  { name: 'Office & Warehouse Rent', code: 'RENT', type: FinanceCategoryTypeEnum.EXPENSE, color: '#14b8a6' },
  { name: 'Utilities, Power & Internet', code: 'UTILITIES', type: FinanceCategoryTypeEnum.EXPENSE, color: '#f97316' },
  { name: 'Shop & Office Equipment', code: 'EQUIPMENT', type: FinanceCategoryTypeEnum.EXPENSE, color: '#8b5cf6' },
  { name: 'Packaging & Mailer Supplies', code: 'PACKAGING', type: FinanceCategoryTypeEnum.EXPENSE, color: '#d97706' },
  { name: 'Software, Hosting & SaaS', code: 'SOFTWARE', type: FinanceCategoryTypeEnum.EXPENSE, color: '#3b82f6' },
  { name: 'Office Admin & Refreshment', code: 'OFFICE_ADMIN', type: FinanceCategoryTypeEnum.EXPENSE, color: '#64748b' },
  { name: 'Maintenance & Repairs', code: 'MAINTENANCE', type: FinanceCategoryTypeEnum.EXPENSE, color: '#0284c7' },
  { name: 'Other Operating Expenses', code: 'OTHER', type: FinanceCategoryTypeEnum.EXPENSE, color: '#94a3b8' },
];

export const REALISTIC_ACCOUNTS = [
  {
    name: 'Cash on Hand / Petty Cash',
    type: FinanceAccountTypeEnum.CASH,
    bankOrProviderName: 'Cash Counter Register',
    startingBalance: '500000.00',
    currentBalance: '500000.00',
    isDefault: true,
  },
  {
    name: 'City Bank Current Operating Account',
    type: FinanceAccountTypeEnum.BANK,
    accountNumber: '20510009843',
    bankOrProviderName: 'City Bank PLC',
    startingBalance: '1550000.00',
    currentBalance: '1550000.00',
    isDefault: false,
  },
  {
    name: 'bKash Merchant Wallet',
    type: FinanceAccountTypeEnum.DIGITAL_WALLET,
    accountNumber: '+8801712000000',
    bankOrProviderName: 'bKash Merchant',
    startingBalance: '320000.00',
    currentBalance: '320000.00',
    isDefault: false,
  },
  {
    name: 'Steadfast Courier COD Settlement',
    type: FinanceAccountTypeEnum.PAYMENT_GATEWAY,
    bankOrProviderName: 'Steadfast Courier',
    startingBalance: '180000.00',
    currentBalance: '180000.00',
    isDefault: false,
  },
];

@Injectable()
export class SeedRealisticFinanceDataService {
  private readonly logger = new Logger(SeedRealisticFinanceDataService.name);

  constructor(
    @InjectRepository(FinanceAccountEntity)
    private readonly accountRepository: Repository<FinanceAccountEntity>,
    @InjectRepository(FinanceCategoryEntity)
    private readonly categoryRepository: Repository<FinanceCategoryEntity>,
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
    @InjectRepository(FinanceInvoiceEntity)
    private readonly invoiceRepository: Repository<FinanceInvoiceEntity>,
    @InjectRepository(FinanceBillEntity)
    private readonly billRepository: Repository<FinanceBillEntity>,
  ) {}

  async execute(tenantId: string, storeId: string, force = false): Promise<void> {
    const existingExpenseCount = await this.transactionRepository.count({
      where: { storeId, type: FinanceTransactionTypeEnum.EXPENSE },
    });
    if (existingExpenseCount > 0 && !force) {
      return; // Already has expenses
    }

    this.logger.log(`Seeding realistic 6-month Bangladesh finance data for store: ${storeId}`);

    // 1. Ensure Accounts
    const accountMap = new Map<string, FinanceAccountEntity>();
    for (const accDef of REALISTIC_ACCOUNTS) {
      let acc = await this.accountRepository.findOne({ where: { storeId, name: accDef.name } });
      if (!acc) {
        acc = this.accountRepository.create({
          tenantId,
          storeId,
          name: accDef.name,
          type: accDef.type,
          accountNumber: (accDef as any).accountNumber,
          bankOrProviderName: accDef.bankOrProviderName,
          currency: 'BDT',
          startingBalance: accDef.startingBalance,
          currentBalance: accDef.currentBalance,
          isDefault: accDef.isDefault,
          isActive: true,
        });
        acc = await this.accountRepository.save(acc);
      }
      accountMap.set(accDef.type, acc);
    }

    const cashAccount = accountMap.get(FinanceAccountTypeEnum.CASH) || (await this.accountRepository.findOne({ where: { storeId } }));
    const bankAccount = accountMap.get(FinanceAccountTypeEnum.BANK) || cashAccount;
    const bkashAccount = accountMap.get(FinanceAccountTypeEnum.DIGITAL_WALLET) || cashAccount;
    const courierAccount = accountMap.get(FinanceAccountTypeEnum.PAYMENT_GATEWAY) || cashAccount;

    // 2. Ensure Categories
    const categoryMap = new Map<string, FinanceCategoryEntity>();
    for (const catDef of REALISTIC_CATEGORIES) {
      let cat = await this.categoryRepository.findOne({ where: { storeId, code: catDef.code } });
      if (!cat) {
        cat = this.categoryRepository.create({
          tenantId,
          storeId,
          name: catDef.name,
          code: catDef.code,
          type: catDef.type,
          color: catDef.color,
          isSystem: true,
        });
        cat = await this.categoryRepository.save(cat);
      }
      categoryMap.set(catDef.code, cat);
    }

    // 3. 6 Months Data Blueprint (May 2026 to October 2026)
    const monthlyProfiles = [
      {
        year: 2026,
        month: 5,
        monthName: 'May 2026',
        sales: 820000,
        shippingRev: 42000,
        cogs: 375000,
        courierCost: 36000,
        salary: 307000,
        rent: 55000,
        electricity: 13500,
        internet: 4500,
        water: 2000,
        marketingMeta: 48000,
        marketingGoogle: 12000,
        packaging: 24000,
        software: 14500,
        officeAdmin: 7500,
        equipment: 0,
        maintenance: 4500,
      },
      {
        year: 2026,
        month: 6,
        monthName: 'June 2026',
        sales: 980000,
        shippingRev: 52000,
        cogs: 440000,
        courierCost: 44000,
        salary: 307000,
        rent: 55000,
        electricity: 15200,
        internet: 4500,
        water: 2200,
        marketingMeta: 55000,
        marketingGoogle: 15000,
        packaging: 28000,
        software: 14500,
        officeAdmin: 8500,
        equipment: 48000, // Barcode scanners + label printers
        equipmentDesc: 'Zebra Barcode Scanners (2x) & Xprinter Thermal Label Printers',
        maintenance: 6000,
      },
      {
        year: 2026,
        month: 7,
        monthName: 'July 2026',
        sales: 1140000,
        shippingRev: 61000,
        cogs: 510000,
        courierCost: 52000,
        salary: 307000,
        rent: 55000,
        electricity: 16800,
        internet: 4500,
        water: 2200,
        marketingMeta: 62000,
        marketingGoogle: 18000,
        packaging: 32000,
        software: 16500,
        officeAdmin: 9200,
        equipment: 35000, // Heavy duty storage rack
        equipmentDesc: 'Heavy-duty slotted angle steel warehouse inventory shelves (4 units)',
        maintenance: 7500,
      },
      {
        year: 2026,
        month: 8,
        monthName: 'August 2026',
        sales: 1280000,
        shippingRev: 68000,
        cogs: 575000,
        courierCost: 58000,
        salary: 481791,
        rent: 55000,
        electricity: 17500,
        internet: 4500,
        water: 2400,
        marketingMeta: 68000,
        marketingGoogle: 22000,
        packaging: 36000,
        software: 16500,
        officeAdmin: 10500,
        equipment: 28000, // Ergonomic chairs
        equipmentDesc: 'Mesh ergonomic office task chairs for fulfillment team (4x)',
        maintenance: 8000,
      },
      {
        year: 2026,
        month: 9,
        monthName: 'September 2026',
        sales: 1450000,
        shippingRev: 76000,
        cogs: 645000,
        courierCost: 65000,
        salary: 481791,
        rent: 55000,
        electricity: 16000,
        internet: 4500,
        water: 2200,
        marketingMeta: 75000,
        marketingGoogle: 25000,
        packaging: 41000,
        software: 18000,
        officeAdmin: 11200,
        equipment: 0,
        maintenance: 8500,
      },
      {
        year: 2026,
        month: 10,
        monthName: 'October 2026',
        sales: 1580000,
        shippingRev: 84000,
        cogs: 705000,
        courierCost: 71000,
        salary: 481791,
        rent: 55000,
        electricity: 15500,
        internet: 4500,
        water: 2200,
        marketingMeta: 82000,
        marketingGoogle: 28000,
        packaging: 45000,
        software: 18000,
        officeAdmin: 12000,
        equipment: 52000, // Shop interior display counter
        equipmentDesc: 'Custom showroom acrylic display showcases & POS cash register station',
        maintenance: 9000,
      },
    ];

    let txnCounter = 1001;

    for (const prof of monthlyProfiles) {
      const yearStr = String(prof.year);
      const monthStr = String(prof.month).padStart(2, '0');

      // 1. Online E-Commerce Sales Income (Batch 1: 10th of month)
      const salesBatch1 = Math.round(prof.sales * 0.45);
      await this.saveTxn({
        tenantId,
        storeId,
        transactionNumber: `TXN-${prof.year}${monthStr}-${txnCounter++}`,
        type: FinanceTransactionTypeEnum.INCOME,
        amount: salesBatch1.toFixed(2),
        transactionDate: `${yearStr}-${monthStr}-10`,
        accountId: bkashAccount?.id,
        category: categoryMap.get('PRODUCT_SALES'),
        description: `E-commerce online checkout orders (bKash/Nagad digital gateway batch #1) - ${prof.monthName}`,
        reference: `ORD-BATCH-${prof.year}${monthStr}-01`,
        sourceType: FinanceSourceTypeEnum.ORDER,
        sourceId: `ORDER-BATCH-${prof.year}${monthStr}-01`,
        paymentMethod: 'ONLINE_GATEWAY',
      });

      // 2. Online E-Commerce Sales Income (Batch 2: 24th of month - Courier COD collected)
      const salesBatch2 = prof.sales - salesBatch1;
      await this.saveTxn({
        tenantId,
        storeId,
        transactionNumber: `TXN-${prof.year}${monthStr}-${txnCounter++}`,
        type: FinanceTransactionTypeEnum.INCOME,
        amount: salesBatch2.toFixed(2),
        transactionDate: `${yearStr}-${monthStr}-24`,
        accountId: courierAccount?.id,
        category: categoryMap.get('PRODUCT_SALES'),
        description: `Steadfast & Pathao Courier Cash-on-Delivery (COD) remittance disbursement - ${prof.monthName}`,
        reference: `COD-REMIT-${prof.year}${monthStr}-02`,
        sourceType: FinanceSourceTypeEnum.ORDER,
        sourceId: `COD-BATCH-${prof.year}${monthStr}-02`,
        paymentMethod: 'COURIER_COD',
      });

      // 3. Customer Delivery / Shipping Fee Income
      await this.saveTxn({
        tenantId,
        storeId,
        transactionNumber: `TXN-${prof.year}${monthStr}-${txnCounter++}`,
        type: FinanceTransactionTypeEnum.INCOME,
        amount: prof.shippingRev.toFixed(2),
        transactionDate: `${yearStr}-${monthStr}-25`,
        accountId: bankAccount?.id,
        category: categoryMap.get('SHIPPING_INCOME'),
        description: `Customer shipping & delivery revenue collection - ${prof.monthName}`,
        reference: `SHIP-INC-${prof.year}${monthStr}`,
        sourceType: FinanceSourceTypeEnum.ORDER,
        sourceId: `SHIP-BATCH-${prof.year}${monthStr}`,
        paymentMethod: 'ONLINE_GATEWAY',
      });

      // 4. Product Procurement & Manufacturing COGS
      await this.saveTxn({
        tenantId,
        storeId,
        transactionNumber: `TXN-${prof.year}${monthStr}-${txnCounter++}`,
        type: FinanceTransactionTypeEnum.EXPENSE,
        amount: prof.cogs.toFixed(2),
        transactionDate: `${yearStr}-${monthStr}-05`,
        accountId: bankAccount?.id,
        category: categoryMap.get('COGS'),
        description: `Wholesale product inventory batch purchase & supplier bill settlement - ${prof.monthName}`,
        reference: `PURCHASE-INV-${prof.year}${monthStr}-01`,
        sourceType: FinanceSourceTypeEnum.BILL,
        sourceId: `PO-${prof.year}${monthStr}-01`,
        paymentMethod: 'BANK_TRANSFER',
      });

      // 5. Courier Delivery Shipping Outflow (Steadfast / Pathao invoice)
      await this.saveTxn({
        tenantId,
        storeId,
        transactionNumber: `TXN-${prof.year}${monthStr}-${txnCounter++}`,
        type: FinanceTransactionTypeEnum.EXPENSE,
        amount: prof.courierCost.toFixed(2),
        transactionDate: `${yearStr}-${monthStr}-28`,
        accountId: courierAccount?.id,
        category: categoryMap.get('SHIPPING'),
        description: `Monthly courier parcel delivery & fulfillment freight fees (Steadfast/Pathao) - ${prof.monthName}`,
        reference: `COURIER-BILL-${prof.year}${monthStr}`,
        sourceType: FinanceSourceTypeEnum.MANUAL,
        sourceId: `COURIER-EXP-${prof.year}${monthStr}`,
        paymentMethod: 'BANK_TRANSFER',
      });

      // 6. Employee Monthly Payroll & Salaries (HRM Synced)
      await this.saveTxn({
        tenantId,
        storeId,
        transactionNumber: `TXN-${prof.year}${monthStr}-${txnCounter++}`,
        type: FinanceTransactionTypeEnum.EXPENSE,
        amount: prof.salary.toFixed(2),
        transactionDate: `${yearStr}-${monthStr}-28`,
        accountId: cashAccount?.id,
        category: categoryMap.get('SALARY'),
        description: `Approved monthly employee salary & staff compensation payroll run - ${prof.monthName}`,
        reference: `PAYROLL-${prof.year}-${monthStr}`,
        sourceType: FinanceSourceTypeEnum.PAYROLL,
        sourceId: `PAYROLL-RUN-${prof.year}-${prof.month}`,
        paymentMethod: 'CASH',
      });

      // 7. Office / Warehouse Rent (Uttara Commercial Center)
      await this.saveTxn({
        tenantId,
        storeId,
        transactionNumber: `TXN-${prof.year}${monthStr}-${txnCounter++}`,
        type: FinanceTransactionTypeEnum.EXPENSE,
        amount: prof.rent.toFixed(2),
        transactionDate: `${yearStr}-${monthStr}-02`,
        accountId: bankAccount?.id,
        category: categoryMap.get('RENT'),
        description: `Monthly commercial shop floor & warehouse lease rent (Uttara Sector 3) - ${prof.monthName}`,
        reference: `RENT-LEASE-${prof.year}${monthStr}`,
        sourceType: FinanceSourceTypeEnum.MANUAL,
        sourceId: `RENT-${prof.year}${monthStr}`,
        paymentMethod: 'BANK_TRANSFER',
      });

      // 8. Electricity Bill (DESCO / DPDC)
      await this.saveTxn({
        tenantId,
        storeId,
        transactionNumber: `TXN-${prof.year}${monthStr}-${txnCounter++}`,
        type: FinanceTransactionTypeEnum.EXPENSE,
        amount: prof.electricity.toFixed(2),
        transactionDate: `${yearStr}-${monthStr}-14`,
        accountId: bkashAccount?.id,
        category: categoryMap.get('UTILITIES'),
        description: `DESCO commercial electricity utility bill for office & warehouse - ${prof.monthName}`,
        reference: `DESCO-UTIL-${prof.year}${monthStr}`,
        sourceType: FinanceSourceTypeEnum.MANUAL,
        sourceId: `DESCO-${prof.year}${monthStr}`,
        paymentMethod: 'MOBILE_BANKING',
      });

      // 9. High-Speed Fiber Internet Bill
      await this.saveTxn({
        tenantId,
        storeId,
        transactionNumber: `TXN-${prof.year}${monthStr}-${txnCounter++}`,
        type: FinanceTransactionTypeEnum.EXPENSE,
        amount: prof.internet.toFixed(2),
        transactionDate: `${yearStr}-${monthStr}-07`,
        accountId: bkashAccount?.id,
        category: categoryMap.get('UTILITIES'),
        description: `Dedicated commercial optical fiber broadband internet (50 Mbps) - ${prof.monthName}`,
        reference: `ISP-DOT-${prof.year}${monthStr}`,
        sourceType: FinanceSourceTypeEnum.MANUAL,
        sourceId: `ISP-${prof.year}${monthStr}`,
        paymentMethod: 'MOBILE_BANKING',
      });

      // 10. Water & Sanitation (WASA)
      await this.saveTxn({
        tenantId,
        storeId,
        transactionNumber: `TXN-${prof.year}${monthStr}-${txnCounter++}`,
        type: FinanceTransactionTypeEnum.EXPENSE,
        amount: prof.water.toFixed(2),
        transactionDate: `${yearStr}-${monthStr}-12`,
        accountId: cashAccount?.id,
        category: categoryMap.get('UTILITIES'),
        description: `Dhaka WASA water utility supply bill - ${prof.monthName}`,
        reference: `WASA-${prof.year}${monthStr}`,
        sourceType: FinanceSourceTypeEnum.MANUAL,
        sourceId: `WASA-${prof.year}${monthStr}`,
        paymentMethod: 'CASH',
      });

      // 11. Meta / Facebook Digital Ads
      await this.saveTxn({
        tenantId,
        storeId,
        transactionNumber: `TXN-${prof.year}${monthStr}-${txnCounter++}`,
        type: FinanceTransactionTypeEnum.EXPENSE,
        amount: prof.marketingMeta.toFixed(2),
        transactionDate: `${yearStr}-${monthStr}-16`,
        accountId: bankAccount?.id,
        category: categoryMap.get('MARKETING'),
        description: `Meta Ads campaign expenditure (Facebook & Instagram sponsored catalog ads) - ${prof.monthName}`,
        reference: `META-ADS-${prof.year}${monthStr}`,
        sourceType: FinanceSourceTypeEnum.MANUAL,
        sourceId: `META-${prof.year}${monthStr}`,
        paymentMethod: 'CARD',
      });

      // 12. Google Search & Performance Max Ads
      await this.saveTxn({
        tenantId,
        storeId,
        transactionNumber: `TXN-${prof.year}${monthStr}-${txnCounter++}`,
        type: FinanceTransactionTypeEnum.EXPENSE,
        amount: prof.marketingGoogle.toFixed(2),
        transactionDate: `${yearStr}-${monthStr}-18`,
        accountId: bankAccount?.id,
        category: categoryMap.get('MARKETING'),
        description: `Google Ads Search & Performance Max shopping campaigns - ${prof.monthName}`,
        reference: `GOOGLE-ADS-${prof.year}${monthStr}`,
        sourceType: FinanceSourceTypeEnum.MANUAL,
        sourceId: `GADS-${prof.year}${monthStr}`,
        paymentMethod: 'CARD',
      });

      // 13. Packaging Materials & Custom Mailer Boxes
      await this.saveTxn({
        tenantId,
        storeId,
        transactionNumber: `TXN-${prof.year}${monthStr}-${txnCounter++}`,
        type: FinanceTransactionTypeEnum.EXPENSE,
        amount: prof.packaging.toFixed(2),
        transactionDate: `${yearStr}-${monthStr}-08`,
        accountId: cashAccount?.id,
        category: categoryMap.get('PACKAGING'),
        description: `Branded corrugated mailer boxes, bubble wrap rolls, and security polybags - ${prof.monthName}`,
        reference: `PACK-SUPPLY-${prof.year}${monthStr}`,
        sourceType: FinanceSourceTypeEnum.BILL,
        sourceId: `PACK-${prof.year}${monthStr}`,
        paymentMethod: 'CASH',
      });

      // 14. Cloud Hosting, Domain & Software Subscriptions
      await this.saveTxn({
        tenantId,
        storeId,
        transactionNumber: `TXN-${prof.year}${monthStr}-${txnCounter++}`,
        type: FinanceTransactionTypeEnum.EXPENSE,
        amount: prof.software.toFixed(2),
        transactionDate: `${yearStr}-${monthStr}-03`,
        accountId: bankAccount?.id,
        category: categoryMap.get('SOFTWARE'),
        description: `AWS cloud infrastructure, Vercel hosting, transactional SMS gateway & ERP SaaS - ${prof.monthName}`,
        reference: `SAAS-CLOUD-${prof.year}${monthStr}`,
        sourceType: FinanceSourceTypeEnum.MANUAL,
        sourceId: `SAAS-${prof.year}${monthStr}`,
        paymentMethod: 'CARD',
      });

      // 15. Office Administration, Refreshment & Stationery
      await this.saveTxn({
        tenantId,
        storeId,
        transactionNumber: `TXN-${prof.year}${monthStr}-${txnCounter++}`,
        type: FinanceTransactionTypeEnum.EXPENSE,
        amount: prof.officeAdmin.toFixed(2),
        transactionDate: `${yearStr}-${monthStr}-20`,
        accountId: cashAccount?.id,
        category: categoryMap.get('OFFICE_ADMIN'),
        description: `Fulfillment staff refreshment, tea, coffee, printer paper & office petty cash - ${prof.monthName}`,
        reference: `ADMIN-PETTY-${prof.year}${monthStr}`,
        sourceType: FinanceSourceTypeEnum.MANUAL,
        sourceId: `ADMIN-${prof.year}${monthStr}`,
        paymentMethod: 'CASH',
      });

      // 16. Equipment Purchase (if any in this month)
      if (prof.equipment > 0) {
        await this.saveTxn({
          tenantId,
          storeId,
          transactionNumber: `TXN-${prof.year}${monthStr}-${txnCounter++}`,
          type: FinanceTransactionTypeEnum.EXPENSE,
          amount: prof.equipment.toFixed(2),
          transactionDate: `${yearStr}-${monthStr}-11`,
          accountId: bankAccount?.id,
          category: categoryMap.get('EQUIPMENT'),
          description: `${prof.equipmentDesc || 'Shop & office equipment'} - ${prof.monthName}`,
          reference: `EQUIP-${prof.year}${monthStr}`,
          sourceType: FinanceSourceTypeEnum.BILL,
          sourceId: `EQUIP-${prof.year}${monthStr}`,
          paymentMethod: 'BANK_TRANSFER',
        });
      }

      // 17. Facility Maintenance & Repairs
      await this.saveTxn({
        tenantId,
        storeId,
        transactionNumber: `TXN-${prof.year}${monthStr}-${txnCounter++}`,
        type: FinanceTransactionTypeEnum.EXPENSE,
        amount: prof.maintenance.toFixed(2),
        transactionDate: `${yearStr}-${monthStr}-22`,
        accountId: cashAccount?.id,
        category: categoryMap.get('MAINTENANCE'),
        description: `Warehouse air conditioning servicing, electrical fitting & shelf repairs - ${prof.monthName}`,
        reference: `MAINT-${prof.year}${monthStr}`,
        sourceType: FinanceSourceTypeEnum.MANUAL,
        sourceId: `MAINT-${prof.year}${monthStr}`,
        paymentMethod: 'CASH',
      });
    }

    // 4. Seed Pending Corporate Invoices (Receivables)
    const pendingInvoices = [
      {
        invoiceNumber: 'INV-2026-001',
        customerName: 'Dhaka Superstore Ltd',
        customerEmail: 'corporate@dhakasuperstore.com',
        customerPhone: '+8801700112233',
        issueDate: '2026-09-15',
        dueDate: '2026-10-05',
        totalAmount: '125000.00',
        paidAmount: '45000.00',
        balanceDue: '80000.00',
        status: FinanceInvoiceStatusEnum.PARTIALLY_PAID,
        notes: 'Corporate bulk seasonal gift hampers batch #1',
      },
      {
        invoiceNumber: 'INV-2026-002',
        customerName: 'Apex Lifestyle Retail',
        customerEmail: 'procurement@apexlifestyle.bd',
        customerPhone: '+8801811223344',
        issueDate: '2026-09-20',
        dueDate: '2026-10-10',
        totalAmount: '95000.00',
        paidAmount: '0.00',
        balanceDue: '95000.00',
        status: FinanceInvoiceStatusEnum.UNPAID,
        notes: 'Consignment inventory delivery for retail outlet #3',
      },
    ];

    for (const invDef of pendingInvoices) {
      const exists = await this.invoiceRepository.findOne({ where: { storeId, invoiceNumber: invDef.invoiceNumber } });
      if (!exists) {
        await this.invoiceRepository.save(
          this.invoiceRepository.create({
            tenantId,
            storeId,
            ...invDef,
            currency: 'BDT',
          }),
        );
      }
    }

    // 5. Seed Supplier Bills (Payables)
    const pendingBills = [
      {
        billNumber: 'BILL-2026-001',
        supplierName: 'Apex Packaging Industries Ltd',
        supplierEmail: 'billing@apexpackaging.bd',
        supplierContact: '+8801911223344',
        category: 'Packaging',
        issueDate: '2026-09-22',
        dueDate: '2026-10-08',
        totalAmount: '45000.00',
        paidAmount: '0.00',
        balanceDue: '45000.00',
        status: FinanceBillStatusEnum.UNPAID,
        notes: 'Bulk custom printed corrugated mailer boxes (5000 pcs)',
      },
      {
        billNumber: 'BILL-2026-002',
        supplierName: 'Bengal Textile Mills Supplier',
        supplierEmail: 'accounts@bengaltextile.bd',
        supplierContact: '+8801722334455',
        category: 'COGS',
        issueDate: '2026-09-25',
        dueDate: '2026-10-15',
        totalAmount: '88000.00',
        paidAmount: '25000.00',
        balanceDue: '63000.00',
        status: FinanceBillStatusEnum.PARTIALLY_PAID,
        notes: 'Autumn apparel fabric procurement batch #2',
      },
    ];

    for (const billDef of pendingBills) {
      const exists = await this.billRepository.findOne({ where: { storeId, billNumber: billDef.billNumber } });
      if (!exists) {
        await this.billRepository.save(
          this.billRepository.create({
            tenantId,
            storeId,
            ...billDef,
          }),
        );
      }
    }

    this.logger.log(`Successfully completed seeding realistic Bangladesh finance dataset.`);
  }

  private async saveTxn(data: {
    tenantId: string;
    storeId: string;
    transactionNumber: string;
    type: FinanceTransactionTypeEnum;
    amount: string;
    transactionDate: string;
    accountId?: string;
    category?: FinanceCategoryEntity;
    description: string;
    reference: string;
    sourceType: FinanceSourceTypeEnum;
    sourceId?: string;
    paymentMethod: string;
  }): Promise<FinanceTransactionEntity> {
    const existing = await this.transactionRepository.findOne({
      where: { storeId: data.storeId, transactionNumber: data.transactionNumber },
    });
    if (existing) {
      return existing;
    }

    const isValidUuid = data.sourceId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.sourceId);

    const entity = this.transactionRepository.create({
      tenantId: data.tenantId,
      storeId: data.storeId,
      transactionNumber: data.transactionNumber,
      type: data.type,
      amount: data.amount,
      currency: 'BDT',
      transactionDate: data.transactionDate,
      accountId: data.accountId,
      categoryId: data.category?.id,
      categoryCode: data.category?.code || 'OTHER',
      description: data.description,
      reference: data.reference,
      sourceType: data.sourceType,
      sourceId: isValidUuid ? data.sourceId : undefined,
      paymentMethod: data.paymentMethod,
      status: FinanceTransactionStatusEnum.COMPLETED,
    });

    return this.transactionRepository.save(entity);
  }
}
