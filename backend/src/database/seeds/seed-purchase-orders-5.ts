import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../data-source';
import { StoreEntity } from '../../modules/tenant/entities/store.entity';
import { ProductEntity } from '../../modules/catalog/entities/product.entity';
import { SupplierEntity, SupplierStatusEnum } from '../../modules/purchase/entities/supplier.entity';
import { PurchaseOrderEntity, PurchaseOrderStatusEnum } from '../../modules/purchase/entities/purchase-order.entity';
import { PurchaseOrderLineEntity } from '../../modules/purchase/entities/purchase-order-line.entity';
import { BillEntity, BillPaymentStatusEnum, BillStatusEnum } from '../../modules/purchase/entities/bill.entity';
import { BillLineEntity } from '../../modules/purchase/entities/bill-line.entity';
import { SupplierPaymentEntity, SupplierPaymentMethodEnum } from '../../modules/purchase/entities/supplier-payment.entity';
import { PurchaseCounterEntity, PurchaseCounterKindEnum } from '../../modules/purchase/entities/purchase-counter.entity';

// Finance Entities
import { FinanceBillEntity } from '../../modules/finance/entities/finance-bill.entity';
import { FinanceBillItemEntity } from '../../modules/finance/entities/finance-bill-item.entity';
import { FinanceTransactionEntity } from '../../modules/finance/entities/finance-transaction.entity';
import { FinanceJournalEntryEntity } from '../../modules/finance/entities/finance-journal-entry.entity';
import { FinanceJournalLineEntity } from '../../modules/finance/entities/finance-journal-line.entity';
import { FinanceChartOfAccountEntity } from '../../modules/finance/entities/finance-chart-of-account.entity';
import { FinanceAccountEntity } from '../../modules/finance/entities/finance-account.entity';
import { FinanceCategoryEntity } from '../../modules/finance/entities/finance-category.entity';
import {
  FinanceBillStatusEnum,
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceSourceTypeEnum,
  FinanceJournalEntryTypeEnum,
  FinanceJournalStatusEnum,
  FinanceLineTypeEnum,
  FinancePartyTypeEnum,
  FinanceAccountClassEnum,
  FinanceNormalBalanceEnum,
  FinanceAccountTypeEnum,
  FinanceCategoryTypeEnum,
} from '../../modules/finance/enums/finance.enums';

const DEMO_SUPPLIERS = [
  { name: 'Apex Fabric & Textiles', contactPerson: 'Mahmudul Hasan', phone: '+880 1711-123456', email: 'mahmud@apexfabrics.com', location: 'Narayanganj, Dhaka' },
  { name: 'Dhaka Leather Works', contactPerson: 'Farhana Ahmed', phone: '+880 1819-654321', email: 'farhana@dhakaleather.com', location: 'Hazaribagh, Dhaka' },
  { name: 'Pacific Garments Accessories', contactPerson: 'Tanvir Hossain', phone: '+880 1912-789012', email: 'tanvir@pacificacc.com', location: 'Chittagong EPZ' },
  { name: 'Bengal Cotton & Yarn Mills', contactPerson: 'Sabrina Yasmin', phone: '+880 1613-345678', email: 'sabrina@bengalcotton.com', location: 'Gazipur, Dhaka' },
  { name: 'Prime Packaging Solutions', contactPerson: 'Kazi Nazmul', phone: '+880 1515-901234', email: 'nazmul@primepack.com', location: 'Tejgaon, Dhaka' },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

interface PoLineConfig {
  prod: ProductEntity;
  qty: number;
  unitCost: number;
  received?: number;
}

interface PoConfig {
  status: PurchaseOrderStatusEnum;
  supplier: SupplierEntity;
  orderDate: string;
  expectedDate: string;
  notes: string;
  lines: PoLineConfig[];
  createBill?: boolean;
  billPaid?: 'PARTIAL' | 'PAID' | 'UNPAID';
}

async function seedPurchaseAndFinanceData() {
  console.log('🌱 Starting Seed for 5 Purchase Orders & Syncing into Finance Module...');
  await AppDataSource.initialize();
  console.log('✅ Connected to database.');

  // Repositories
  const storeRepo = AppDataSource.getRepository(StoreEntity);
  const productRepo = AppDataSource.getRepository(ProductEntity);
  const supplierRepo = AppDataSource.getRepository(SupplierEntity);
  const poRepo = AppDataSource.getRepository(PurchaseOrderEntity);
  const poLineRepo = AppDataSource.getRepository(PurchaseOrderLineEntity);
  const billRepo = AppDataSource.getRepository(BillEntity);
  const billLineRepo = AppDataSource.getRepository(BillLineEntity);
  const paymentRepo = AppDataSource.getRepository(SupplierPaymentEntity);
  const counterRepo = AppDataSource.getRepository(PurchaseCounterEntity);

  // Finance Repositories
  const finBillRepo = AppDataSource.getRepository(FinanceBillEntity);
  const finBillItemRepo = AppDataSource.getRepository(FinanceBillItemEntity);
  const finTxnRepo = AppDataSource.getRepository(FinanceTransactionEntity);
  const finJeRepo = AppDataSource.getRepository(FinanceJournalEntryEntity);
  const finJlRepo = AppDataSource.getRepository(FinanceJournalLineEntity);
  const finCoaRepo = AppDataSource.getRepository(FinanceChartOfAccountEntity);
  const finAccRepo = AppDataSource.getRepository(FinanceAccountEntity);
  const finCatRepo = AppDataSource.getRepository(FinanceCategoryEntity);

  const stores = await storeRepo.find();
  if (stores.length === 0) {
    console.error('❌ No stores found in the database.');
    process.exit(1);
  }

  for (const store of stores) {
    console.log(`\n📦 Processing store: "${store.name}" (${store.id})...`);
    const tenantId = store.tenantId;
    const storeId = store.id;

    // Clean previous purchase records
    await paymentRepo.delete({ storeId });
    await billLineRepo.delete({ storeId });
    await billRepo.delete({ storeId });
    await poLineRepo.delete({ storeId });
    await poRepo.delete({ storeId });

    // Clean previous finance bills
    const existingFinBills = await finBillRepo.find({ where: { storeId } });
    for (const fb of existingFinBills) {
      await finBillItemRepo.delete({ billId: fb.id });
    }
    await finBillRepo.delete({ storeId });

    // Ensure Basic Chart of Accounts exists
    let inventoryCoa = await finCoaRepo.findOne({ where: { storeId, code: '1300' } });
    if (!inventoryCoa) {
      inventoryCoa = await finCoaRepo.save(
        finCoaRepo.create({
          tenantId,
          storeId,
          code: '1300',
          name: 'Merchandise Inventory Asset',
          accountClass: FinanceAccountClassEnum.ASSET,
          subType: 'INVENTORY',
          normalBalance: FinanceNormalBalanceEnum.DEBIT,
          currentBalance: '0',
          isSystem: true,
          isActive: true,
        })
      );
    }

    let apCoa = await finCoaRepo.findOne({ where: { storeId, code: '2010' } });
    if (!apCoa) {
      apCoa = await finCoaRepo.save(
        finCoaRepo.create({
          tenantId,
          storeId,
          code: '2010',
          name: 'Accounts Payable (Supplier Bills)',
          accountClass: FinanceAccountClassEnum.LIABILITY,
          subType: 'CURRENT_LIABILITY',
          normalBalance: FinanceNormalBalanceEnum.CREDIT,
          currentBalance: '0',
          isSystem: true,
          isActive: true,
        })
      );
    }

    let bankCoa = await finCoaRepo.findOne({ where: { storeId, code: '1020' } });
    if (!bankCoa) {
      bankCoa = await finCoaRepo.save(
        finCoaRepo.create({
          tenantId,
          storeId,
          code: '1020',
          name: 'Main Business Bank Account',
          accountClass: FinanceAccountClassEnum.ASSET,
          subType: 'BANK',
          normalBalance: FinanceNormalBalanceEnum.DEBIT,
          currentBalance: '500000',
          isSystem: true,
          isActive: true,
        })
      );
    }

    // Ensure a default Finance Account exists (e.g. City Bank Operating Account)
    let defaultFinAccount = await finAccRepo.findOne({ where: { storeId, isDefault: true } });
    if (!defaultFinAccount) {
      defaultFinAccount = await finAccRepo.findOne({ where: { storeId } });
    }
    if (!defaultFinAccount) {
      defaultFinAccount = await finAccRepo.save(
        finAccRepo.create({
          tenantId,
          storeId,
          name: 'Primary Commercial Bank Account',
          type: FinanceAccountTypeEnum.BANK,
          accountNumber: '110293848102',
          bankOrProviderName: 'City Bank Ltd.',
          currency: 'BDT',
          currentBalance: '500000',
          startingBalance: '500000',
          isDefault: true,
          isActive: true,
        })
      );
    }

    // Ensure Category for Inventory / Purchases exists in Finance
    let inventoryCat = await finCatRepo.findOne({ where: { storeId, code: 'INVENTORY_PURCHASE' } });
    if (!inventoryCat) {
      inventoryCat = await finCatRepo.save(
        finCatRepo.create({
          tenantId,
          storeId,
          name: 'Inventory & Purchases',
          code: 'INVENTORY_PURCHASE',
          type: FinanceCategoryTypeEnum.EXPENSE,
          color: '#3B82F6',
          isSystem: true,
          description: 'Cost of purchasing stock and inventory supplies',
        })
      );
    }

    // Get catalog products
    let products = await productRepo.find({ where: { tenantId }, take: 10 });
    if (products.length === 0) {
      products = await productRepo.find({ take: 10 });
    }
    if (products.length === 0) {
      const placeholderProd = productRepo.create({
        tenantId,
        name: 'Standard Wholesale Cotton T-Shirt',
        slug: 'standard-wholesale-cotton-tshirt-' + Date.now(),
        sku: 'WHL-TSHIRT-001',
        costPrice: 250,
        basePrice: 450,
      });
      await productRepo.save(placeholderProd);
      products = [placeholderProd];
    }

    // 1. Create or Find Suppliers
    const suppliers: SupplierEntity[] = [];
    for (const data of DEMO_SUPPLIERS) {
      let sup = await supplierRepo.findOne({ where: { storeId, name: data.name } });
      if (!sup) {
        sup = supplierRepo.create({
          tenantId,
          storeId,
          name: data.name,
          contactPerson: data.contactPerson,
          phone: data.phone,
          email: data.email,
          location: data.location,
          status: SupplierStatusEnum.ACTIVE,
          openingBalance: '0',
          notes: 'Registered demo supplier',
        });
        sup = await supplierRepo.save(sup);
      }
      suppliers.push(sup);
    }

    let poSeq = 1;
    let billSeq = 1;
    let paymentSeq = 1;
    let jeSeq = 1;
    let txnSeq = 1;
    const year = new Date().getFullYear();

    // 2. Create 5 Diverse Purchase Orders
    const poConfigs: PoConfig[] = [
      {
        status: PurchaseOrderStatusEnum.DRAFT,
        supplier: suppliers[0],
        orderDate: daysAgo(1),
        expectedDate: daysFromNow(7),
        notes: 'Seasonal stock replenishment - initial draft.',
        lines: [
          { prod: products[0], qty: 25, unitCost: 180 },
          { prod: products[1 % products.length], qty: 40, unitCost: 120 },
        ],
      },
      {
        status: PurchaseOrderStatusEnum.SENT,
        supplier: suppliers[1],
        orderDate: daysAgo(4),
        expectedDate: daysFromNow(3),
        notes: 'Order confirmed and awaiting delivery from vendor.',
        lines: [
          { prod: products[0], qty: 60, unitCost: 175 },
          { prod: products[2 % products.length], qty: 30, unitCost: 350 },
        ],
      },
      {
        status: PurchaseOrderStatusEnum.PARTIALLY_RECEIVED,
        supplier: suppliers[2],
        orderDate: daysAgo(10),
        expectedDate: daysAgo(2),
        notes: 'Urgent wholesale lot. 1st batch received at central warehouse.',
        lines: [
          { prod: products[1 % products.length], qty: 100, unitCost: 115, received: 50 },
          { prod: products[2 % products.length], qty: 50, unitCost: 340, received: 25 },
        ],
      },
      {
        status: PurchaseOrderStatusEnum.FULLY_RECEIVED,
        supplier: suppliers[3],
        orderDate: daysAgo(18),
        expectedDate: daysAgo(12),
        notes: 'Bulk purchase order fulfilled in full. Invoice and payment processed.',
        lines: [
          { prod: products[0], qty: 80, unitCost: 170, received: 80 },
          { prod: products[1 % products.length], qty: 120, unitCost: 110, received: 120 },
        ],
        createBill: true,
        billPaid: 'PARTIAL',
      },
      {
        status: PurchaseOrderStatusEnum.FULLY_RECEIVED,
        supplier: suppliers[4],
        orderDate: daysAgo(25),
        expectedDate: daysAgo(20),
        notes: 'Packaging materials batch - fully received and paid.',
        lines: [
          { prod: products[2 % products.length], qty: 200, unitCost: 45, received: 200 },
        ],
        createBill: true,
        billPaid: 'PAID',
      },
    ];

    for (const cfg of poConfigs) {
      const poNum = `PO-${year}-${String(poSeq).padStart(4, '0')}`;
      poSeq++;

      let subtotalNum = 0;
      let receivedValNum = 0;

      const po = poRepo.create({
        tenantId,
        storeId,
        poNumber: poNum,
        supplierId: cfg.supplier.id,
        supplierName: cfg.supplier.name,
        orderDate: cfg.orderDate,
        expectedDate: cfg.expectedDate,
        status: cfg.status,
        notes: cfg.notes,
        subtotal: '0',
        totalAmount: '0',
        receivedValue: '0',
      });

      const savedPo = await poRepo.save(po);

      const lines: PurchaseOrderLineEntity[] = [];
      for (let i = 0; i < cfg.lines.length; i++) {
        const item = cfg.lines[i];
        const lineTot = item.qty * item.unitCost;
        subtotalNum += lineTot;
        const recQty = item.received ?? 0;
        receivedValNum += recQty * item.unitCost;

        const line = poLineRepo.create({
          storeId,
          purchaseOrderId: savedPo.id,
          productId: item.prod.id,
          productName: item.prod.name,
          sku: item.prod.sku || `SKU-${item.prod.id.slice(0, 6)}`,
          quantity: item.qty,
          receivedQuantity: recQty,
          unitCost: item.unitCost.toFixed(2),
          lineTotal: lineTot.toFixed(2),
          lineOrder: i + 1,
        });
        lines.push(line);
      }

      await poLineRepo.save(lines);

      savedPo.subtotal = subtotalNum.toFixed(2);
      savedPo.totalAmount = subtotalNum.toFixed(2);
      savedPo.receivedValue = receivedValNum.toFixed(2);

      // Create linked bill if configured
      if (cfg.createBill) {
        const billNum = `PUR-${year}-${String(billSeq).padStart(4, '0')}`;
        billSeq++;

        const totalItemsCount = cfg.lines.reduce(
          (sum, line) => sum + (line.received ?? line.qty),
          0,
        );

        // 1. Create Purchase Bill
        const bill = billRepo.create({
          tenantId,
          storeId,
          billNumber: billNum,
          supplierInvoiceNo: `INV-VEND-${Date.now().toString().slice(-5)}`,
          supplierId: cfg.supplier.id,
          supplierName: cfg.supplier.name,
          purchaseOrderId: savedPo.id,
          billDate: cfg.orderDate,
          dueDate: daysFromNow(15),
          subtotal: subtotalNum.toFixed(2),
          totalAmount: subtotalNum.toFixed(2),
          paidAmount: '0',
          itemsCount: totalItemsCount,
          paymentStatus: BillPaymentStatusEnum.UNPAID,
          status: BillStatusEnum.OPEN,
          notes: `Bill raised from ${poNum}`,
        });

        const savedBill = await billRepo.save(bill);
        savedPo.billId = savedBill.id;

        const bLines = cfg.lines.map((l, i) =>
          billLineRepo.create({
            storeId,
            billId: savedBill.id,
            productId: l.prod.id,
            productName: l.prod.name,
            sku: l.prod.sku || `SKU-${l.prod.id.slice(0, 6)}`,
            quantity: l.received ?? l.qty,
            unitCost: l.unitCost.toFixed(2),
            lineTotal: ((l.received ?? l.qty) * l.unitCost).toFixed(2),
            lineOrder: i + 1,
          }),
        );
        await billLineRepo.save(bLines);

        // 2. CREATE CORRESPONDING FINANCE BILL (fin_bills & fin_bill_items)
        const finBillStatus =
          cfg.billPaid === 'PAID'
            ? FinanceBillStatusEnum.PAID
            : cfg.billPaid === 'PARTIAL'
            ? FinanceBillStatusEnum.PARTIALLY_PAID
            : FinanceBillStatusEnum.UNPAID;

        const paidAmtNum =
          cfg.billPaid === 'PAID'
            ? subtotalNum
            : cfg.billPaid === 'PARTIAL'
            ? Number((subtotalNum * 0.5).toFixed(2))
            : 0;

        const balanceDueNum = Number((subtotalNum - paidAmtNum).toFixed(2));

        const finBill = finBillRepo.create({
          tenantId,
          storeId,
          billNumber: `FIN-${billNum}`,
          supplierName: cfg.supplier.name,
          supplierEmail: cfg.supplier.email,
          supplierContact: cfg.supplier.phone,
          category: 'INVENTORY_PURCHASE',
          issueDate: cfg.orderDate,
          dueDate: daysFromNow(15),
          subtotal: subtotalNum.toFixed(2),
          taxAmount: '0.00',
          totalAmount: subtotalNum.toFixed(2),
          paidAmount: paidAmtNum.toFixed(2),
          balanceDue: balanceDueNum.toFixed(2),
          currency: 'BDT',
          status: finBillStatus,
          notes: `Synchronized Purchase Bill for ${cfg.supplier.name} (${poNum})`,
        });
        const savedFinBill = await finBillRepo.save(finBill);

        // Fin Bill items
        const finItems = cfg.lines.map((l) =>
          finBillItemRepo.create({
            billId: savedFinBill.id,
            title: l.prod.name,
            description: `Product: ${l.prod.name} (SKU: ${l.prod.sku || 'N/A'})`,
            quantity: l.received ?? l.qty,
            unitPrice: l.unitCost.toFixed(2),
            taxRate: '0.00',
            totalAmount: ((l.received ?? l.qty) * l.unitCost).toFixed(2),
          })
        );
        await finBillItemRepo.save(finItems);

        // 3. POST DOUBLE-ENTRY JOURNAL ENTRY FOR BILL RECOGNITION
        // Debit Inventory (1300), Credit Accounts Payable (2010)
        const jeNum = `JE-${year}-${String(jeSeq++).padStart(4, '0')}`;
        const billJe = finJeRepo.create({
          tenantId,
          storeId,
          entryNumber: jeNum,
          entryDate: cfg.orderDate,
          sourceType: FinanceJournalEntryTypeEnum.BILL,
          sourceId: savedFinBill.id,
          sourceReference: billNum,
          description: `Supplier Bill AP Recognition: ${cfg.supplier.name} (${billNum})`,
          totalDebit: subtotalNum.toFixed(2),
          totalCredit: subtotalNum.toFixed(2),
          isBalanced: true,
          status: FinanceJournalStatusEnum.POSTED,
          currency: 'BDT',
          postedByName: 'System Auto-Post',
        });
        const savedJe = await finJeRepo.save(billJe);

        await finJlRepo.save([
          finJlRepo.create({
            tenantId,
            storeId,
            journalEntryId: savedJe.id,
            accountId: inventoryCoa.id,
            accountCode: inventoryCoa.code,
            accountName: inventoryCoa.name,
            type: FinanceLineTypeEnum.DEBIT,
            amount: subtotalNum.toFixed(2),
            description: `Inventory Asset Add: ${cfg.supplier.name}`,
            partyType: FinancePartyTypeEnum.SUPPLIER,
            partyName: cfg.supplier.name,
          }),
          finJlRepo.create({
            tenantId,
            storeId,
            journalEntryId: savedJe.id,
            accountId: apCoa.id,
            accountCode: apCoa.code,
            accountName: apCoa.name,
            type: FinanceLineTypeEnum.CREDIT,
            amount: subtotalNum.toFixed(2),
            description: `Accounts Payable Accrual: ${cfg.supplier.name}`,
            partyType: FinancePartyTypeEnum.SUPPLIER,
            partyName: cfg.supplier.name,
          }),
        ]);

        // 4. Handle Payments & Sync to Finance Transactions + Bank/Cash Journal Entries
        if (cfg.billPaid === 'PARTIAL' || cfg.billPaid === 'PAID') {
          savedBill.paidAmount = paidAmtNum.toFixed(2);
          savedBill.paymentStatus =
            cfg.billPaid === 'PARTIAL' ? BillPaymentStatusEnum.PARTIAL : BillPaymentStatusEnum.PAID;
          await billRepo.save(savedBill);

          const payDate = cfg.billPaid === 'PARTIAL' ? daysAgo(5) : daysAgo(10);
          const payNumber = `SPAY-${year}-${String(paymentSeq++).padStart(4, '0')}`;

          await paymentRepo.save(
            paymentRepo.create({
              tenantId,
              storeId,
              supplierId: cfg.supplier.id,
              supplierName: cfg.supplier.name,
              billId: savedBill.id,
              paymentNumber: payNumber,
              paymentDate: payDate,
              amount: paidAmtNum.toFixed(2),
              method: SupplierPaymentMethodEnum.BANK_TRANSFER,
              reference: `TXN-BNK-${Date.now().toString().slice(-4)}`,
              notes: `${cfg.billPaid === 'PARTIAL' ? '50% Partial payment' : 'Full settlement'} via bank transfer.`,
            })
          );

          // Finance Transaction (fin_transactions)
          await finTxnRepo.save(
            finTxnRepo.create({
              tenantId,
              storeId,
              transactionNumber: `TXN-${year}-${String(txnSeq++).padStart(4, '0')}`,
              type: FinanceTransactionTypeEnum.EXPENSE,
              amount: paidAmtNum.toFixed(2),
              currency: 'BDT',
              transactionDate: payDate,
              accountId: defaultFinAccount.id,
              categoryId: inventoryCat.id,
              categoryCode: 'INVENTORY_PURCHASE',
              description: `Supplier Bill Settlement: ${cfg.supplier.name} (${billNum})`,
              reference: payNumber,
              sourceType: FinanceSourceTypeEnum.BILL,
              sourceId: savedFinBill.id,
              paymentMethod: 'BANK_TRANSFER',
              status: FinanceTransactionStatusEnum.COMPLETED,
            })
          );

          // Payment Journal Entry: Debit Accounts Payable (2010), Credit Bank (1020)
          const payJeNum = `JE-${year}-${String(jeSeq++).padStart(4, '0')}`;
          const payJe = finJeRepo.create({
            tenantId,
            storeId,
            entryNumber: payJeNum,
            entryDate: payDate,
            sourceType: FinanceJournalEntryTypeEnum.BILL,
            sourceId: savedFinBill.id,
            sourceReference: payNumber,
            description: `Payment Settlement for ${cfg.supplier.name} (${billNum})`,
            totalDebit: paidAmtNum.toFixed(2),
            totalCredit: paidAmtNum.toFixed(2),
            isBalanced: true,
            status: FinanceJournalStatusEnum.POSTED,
            currency: 'BDT',
            postedByName: 'System Auto-Post',
          });
          const savedPayJe = await finJeRepo.save(payJe);

          await finJlRepo.save([
            finJlRepo.create({
              tenantId,
              storeId,
              journalEntryId: savedPayJe.id,
              accountId: apCoa.id,
              accountCode: apCoa.code,
              accountName: apCoa.name,
              type: FinanceLineTypeEnum.DEBIT,
              amount: paidAmtNum.toFixed(2),
              description: `AP Settlement: ${cfg.supplier.name}`,
              partyType: FinancePartyTypeEnum.SUPPLIER,
              partyName: cfg.supplier.name,
            }),
            finJlRepo.create({
              tenantId,
              storeId,
              journalEntryId: savedPayJe.id,
              accountId: bankCoa.id,
              accountCode: bankCoa.code,
              accountName: bankCoa.name,
              type: FinanceLineTypeEnum.CREDIT,
              amount: paidAmtNum.toFixed(2),
              description: `Bank Outflow for AP: ${cfg.supplier.name}`,
              partyType: FinancePartyTypeEnum.SUPPLIER,
              partyName: cfg.supplier.name,
            }),
          ]);
        }
      }

      await poRepo.save(savedPo);
      console.log(`  ✅ Seeded ${poNum} [${cfg.status}] - Total: ৳ ${savedPo.totalAmount} (Supplier: ${cfg.supplier.name})`);
    }

    // Update Purchase Counters
    let poCounter = await counterRepo.findOne({ where: { storeId, kind: PurchaseCounterKindEnum.PO } });
    if (!poCounter) {
      await counterRepo.save(
        counterRepo.create({
          tenantId,
          storeId,
          kind: PurchaseCounterKindEnum.PO,
          prefix: 'PO-',
          nextSequence: poSeq,
        }),
      );
    } else {
      poCounter.nextSequence = poSeq;
      await counterRepo.save(poCounter);
    }

    let billCounter = await counterRepo.findOne({ where: { storeId, kind: PurchaseCounterKindEnum.BILL } });
    if (!billCounter) {
      await counterRepo.save(
        counterRepo.create({
          tenantId,
          storeId,
          kind: PurchaseCounterKindEnum.BILL,
          prefix: 'PUR-',
          nextSequence: billSeq,
        }),
      );
    } else {
      billCounter.nextSequence = billSeq;
      await counterRepo.save(billCounter);
    }

    let paymentCounter = await counterRepo.findOne({ where: { storeId, kind: PurchaseCounterKindEnum.PAYMENT } });
    if (!paymentCounter) {
      await counterRepo.save(
        counterRepo.create({
          tenantId,
          storeId,
          kind: PurchaseCounterKindEnum.PAYMENT,
          prefix: 'SPAY-',
          nextSequence: paymentSeq,
        }),
      );
    } else {
      paymentCounter.nextSequence = paymentSeq;
      await counterRepo.save(paymentCounter);
    }
  }

  console.log('\n🎉 Successfully seeded and merged all Purchase data into Finance module!');
  await AppDataSource.destroy();
}

seedPurchaseAndFinanceData().catch((err) => {
  console.error('❌ Error seeding purchase and finance data:', err);
  process.exit(1);
});
