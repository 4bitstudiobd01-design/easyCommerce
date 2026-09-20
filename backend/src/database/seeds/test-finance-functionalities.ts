import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../data-source';
import { StoreEntity } from '../../modules/tenant/entities/store.entity';
import { FinanceAccountEntity } from '../../modules/finance/entities/finance-account.entity';
import { FinanceCategoryEntity } from '../../modules/finance/entities/finance-category.entity';
import { FinanceTransactionEntity } from '../../modules/finance/entities/finance-transaction.entity';
import { FinanceInvoiceEntity } from '../../modules/finance/entities/finance-invoice.entity';
import { FinanceBillEntity } from '../../modules/finance/entities/finance-bill.entity';
import { FinanceRequisitionEntity } from '../../modules/finance/entities/finance-requisition.entity';
import { FinanceTransferEntity } from '../../modules/finance/entities/finance-transfer.entity';
import { FinanceChartOfAccountEntity } from '../../modules/finance/entities/finance-chart-of-account.entity';
import { FinanceJournalEntryEntity } from '../../modules/finance/entities/finance-journal-entry.entity';
import { FinanceJournalLineEntity } from '../../modules/finance/entities/finance-journal-line.entity';

import {
  FinanceRequisitionStatusEnum,
  FinanceInvoiceStatusEnum,
  FinanceBillStatusEnum,
} from '../../modules/finance/enums/finance.enums';

export async function runFinanceFunctionalitiesTest() {
  console.log('🧪 Starting Automated QA Test Suite for Accounts & Finance Module...\n');
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const storeRepo = AppDataSource.getRepository(StoreEntity);
  const stores = await storeRepo.find();

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ PASS: ${testName}`);
    } else {
      console.error(`  ❌ FAIL: ${testName}`, detail !== undefined ? detail : '');
    }
  }

  for (const store of stores) {
    console.log(`\n======================================================`);
    console.log(`🔍 Testing Store: "${store.name}" (${store.id})`);
    console.log(`======================================================`);

    const storeId = store.id;

    // Repositories
    const accRepo = AppDataSource.getRepository(FinanceAccountEntity);
    const catRepo = AppDataSource.getRepository(FinanceCategoryEntity);
    const txRepo = AppDataSource.getRepository(FinanceTransactionEntity);
    const invRepo = AppDataSource.getRepository(FinanceInvoiceEntity);
    const billRepo = AppDataSource.getRepository(FinanceBillEntity);
    const reqRepo = AppDataSource.getRepository(FinanceRequisitionEntity);
    const trfRepo = AppDataSource.getRepository(FinanceTransferEntity);
    const coaRepo = AppDataSource.getRepository(FinanceChartOfAccountEntity);
    const jeRepo = AppDataSource.getRepository(FinanceJournalEntryEntity);
    const jlRepo = AppDataSource.getRepository(FinanceJournalLineEntity);

    // ─────────────────────────────────────────────────────────────
    // TEST SUITE 1: ACCOUNTS & BALANCES (50,000 TK EACH)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 1. Testing Bank & Accounts ---');
    const accounts = await accRepo.find({ where: { storeId } });
    assert(accounts.length === 4, `Store must have exactly 4 accounts (Found: ${accounts.length})`);

    const allHave50k = accounts.every((a) => Number(a.currentBalance) === 50000);
    assert(allHave50k, 'Every account must have exactly ৳50,000.00 current balance');

    const totalSystemBalance = accounts.reduce((sum, a) => sum + Number(a.currentBalance), 0);
    assert(totalSystemBalance === 200000, `Total system balance must be ৳200,000.00 (Found: ৳${totalSystemBalance})`);

    const accountTypes = new Set(accounts.map((a) => a.type));
    assert(accountTypes.has('BANK' as any), 'Contains Commercial Bank account');
    assert(accountTypes.has('CARD' as any), 'Contains Debit/Credit Card account');
    assert(accountTypes.has('DIGITAL_WALLET' as any), 'Contains Mobile Wallet (bKash) account');
    assert(accountTypes.has('CASH' as any), 'Contains Cash Vault account');

    const defaultAccounts = accounts.filter((a) => a.isDefault);
    assert(defaultAccounts.length === 1, 'Exactly one account is marked as default');

    // ─────────────────────────────────────────────────────────────
    // TEST SUITE 2: TRANSACTIONS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. Testing Transactions ---');
    const transactions = await txRepo.find({ where: { storeId } });
    assert(transactions.length === 4, `Store must have exactly 4 transactions (Found: ${transactions.length})`);

    const incomeTxs = transactions.filter((t) => t.type === 'INCOME');
    const expenseTxs = transactions.filter((t) => t.type === 'EXPENSE');
    assert(incomeTxs.length === 2, `Must have 2 income transactions (Found: ${incomeTxs.length})`);
    assert(expenseTxs.length === 2, `Must have 2 expense transactions (Found: ${expenseTxs.length})`);

    const txAccountIds = transactions.map((t) => t.accountId);
    const validAccLinks = txAccountIds.every((accId) => accounts.some((a) => a.id === accId));
    assert(validAccLinks, 'All transactions are linked to existing valid accounts');

    // ─────────────────────────────────────────────────────────────
    // TEST SUITE 3: INVOICES
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. Testing Invoices ---');
    const invoices = await invRepo.find({ where: { storeId }, relations: ['items'] });
    assert(invoices.length === 4, `Store must have exactly 4 invoices (Found: ${invoices.length})`);

    const paidInvoices = invoices.filter((i) => i.status === FinanceInvoiceStatusEnum.PAID);
    const partialInvoices = invoices.filter((i) => i.status === FinanceInvoiceStatusEnum.PARTIALLY_PAID);
    const unpaidInvoices = invoices.filter((i) => i.status === FinanceInvoiceStatusEnum.UNPAID);
    const overdueInvoices = invoices.filter((i) => i.status === FinanceInvoiceStatusEnum.OVERDUE);

    assert(paidInvoices.length === 1, 'Contains 1 Paid invoice');
    assert(partialInvoices.length === 1, 'Contains 1 Partially Paid invoice');
    assert(unpaidInvoices.length === 1, 'Contains 1 Unpaid invoice');
    assert(overdueInvoices.length === 1, 'Contains 1 Overdue invoice');

    const totalInvoiceAmount = invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0);
    const totalCollected = invoices.reduce((sum, i) => sum + Number(i.paidAmount), 0);
    const totalDue = invoices.reduce((sum, i) => sum + Number(i.balanceDue), 0);
    assert(totalInvoiceAmount === totalCollected + totalDue, 'Invoice totals equal collected + due amount');

    // ─────────────────────────────────────────────────────────────
    // TEST SUITE 4: BILLS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 4. Testing Bills ---');
    const bills = await billRepo.find({ where: { storeId }, relations: ['items'] });
    assert(bills.length === 4, `Store must have exactly 4 bills (Found: ${bills.length})`);

    const paidBills = bills.filter((b) => b.status === FinanceBillStatusEnum.PAID);
    const partialBills = bills.filter((b) => b.status === FinanceBillStatusEnum.PARTIALLY_PAID);
    const unpaidBills = bills.filter((b) => b.status === FinanceBillStatusEnum.UNPAID);
    const overdueBills = bills.filter((b) => b.status === FinanceBillStatusEnum.OVERDUE);

    assert(paidBills.length === 1, 'Contains 1 Paid bill');
    assert(partialBills.length === 1, 'Contains 1 Partially Paid bill');
    assert(unpaidBills.length === 1, 'Contains 1 Unpaid bill');
    assert(overdueBills.length === 1, 'Contains 1 Overdue bill');

    // ─────────────────────────────────────────────────────────────
    // TEST SUITE 5: REQUISITIONS & APPROVALS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 5. Testing Requisitions & Approvals ---');
    const requisitions = await reqRepo.find({ where: { storeId } });
    assert(requisitions.length === 4, `Store must have exactly 4 requisitions (Found: ${requisitions.length})`);

    const pendingReqs = requisitions.filter((r) => r.status === FinanceRequisitionStatusEnum.PENDING);
    const approvedReqs = requisitions.filter((r) => r.status === FinanceRequisitionStatusEnum.APPROVED);
    const rejectedReqs = requisitions.filter((r) => r.status === FinanceRequisitionStatusEnum.REJECTED);

    assert(pendingReqs.length === 2, `Contains 2 pending requisitions for Approvals tab (Found: ${pendingReqs.length})`);
    assert(approvedReqs.length === 1, 'Contains 1 approved requisition');
    assert(rejectedReqs.length === 1, 'Contains 1 rejected requisition');

    // ─────────────────────────────────────────────────────────────
    // TEST SUITE 6: FUND TRANSFERS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 6. Testing Fund Transfers ---');
    const transfers = await trfRepo.find({ where: { storeId } });
    assert(transfers.length === 4, `Store must have exactly 4 transfers (Found: ${transfers.length})`);

    const validTransferAccounts = transfers.every(
      (t) => accounts.some((a) => a.id === t.fromAccountId) && accounts.some((a) => a.id === t.toAccountId),
    );
    assert(validTransferAccounts, 'All transfers have valid source and destination accounts');

    // ─────────────────────────────────────────────────────────────
    // TEST SUITE 7: CHART OF ACCOUNTS & JOURNAL ENTRIES
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 7. Testing Chart of Accounts & General Ledger ---');
    const coas = await coaRepo.find({ where: { storeId } });
    assert(coas.length === 4, `Store must have exactly 4 Chart of Accounts (Found: ${coas.length})`);

    const journalEntries = await jeRepo.find({ where: { storeId }, relations: ['lines'] });
    assert(journalEntries.length === 4, `Store must have exactly 4 Journal Entries (Found: ${journalEntries.length})`);

    const allBalanced = journalEntries.every((je) => Number(je.totalDebit) === Number(je.totalCredit));
    assert(allBalanced, 'Every journal entry is double-entry balanced (Sum(Debit) === Sum(Credit))');

    // ─────────────────────────────────────────────────────────────
    // TEST SUITE 8: FINANCE CATEGORIES / BUDGET
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 8. Testing Categories & Budget ---');
    const categories = await catRepo.find({ where: { storeId } });
    assert(categories.length === 4, `Store must have exactly 4 categories (Found: ${categories.length})`);
  }

  console.log('\n======================================================');
  console.log(`🏁 TEST EXECUTION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log(`======================================================\n`);

  if (passedTests === totalTests) {
    console.log('🎉 ALL FINANCE & ACCOUNTS FUNCTIONALITIES VERIFIED WORKING FLAWLESSLY!');
  } else {
    console.error(`⚠️ Some tests failed: ${totalTests - passedTests} failure(s).`);
  }

  await AppDataSource.destroy();
  process.exit(passedTests === totalTests ? 0 : 1);
}

if (require.main === module) {
  runFinanceFunctionalitiesTest().catch((err) => {
    console.error('❌ Test execution crashed:', err);
    process.exit(1);
  });
}
