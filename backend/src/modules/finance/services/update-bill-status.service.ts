import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FinanceBillEntity } from '../entities/finance-bill.entity';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { UpdateFinanceBillStatusDto } from '../dto/bill.dto';
import {
  FinanceBillStatusEnum,
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceSourceTypeEnum,
} from '../enums/finance.enums';
import { SyncModuleFinanceService } from './sync-module-finance.service';

@Injectable()
export class UpdateBillStatusService {
  constructor(
    @InjectRepository(FinanceBillEntity)
    private readonly billRepository: Repository<FinanceBillEntity>,
    @InjectRepository(FinanceAccountEntity)
    private readonly accountRepository: Repository<FinanceAccountEntity>,
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
    private readonly dataSource: DataSource,
    private readonly syncModuleFinanceService: SyncModuleFinanceService,
  ) {}

  async execute(
    storeId: string,
    billId: string,
    userId: string,
    dto: UpdateFinanceBillStatusDto,
  ): Promise<FinanceBillEntity> {
    const bill = await this.billRepository.findOne({
      where: { id: billId, storeId },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found.');
    }

    const wasPaid = bill.status === FinanceBillStatusEnum.PAID;
    const isPaying = dto.status === FinanceBillStatusEnum.PAID;
    const newStatus = dto.status;

    // 1. Marking as PAID
    if (isPaying) {
      if (wasPaid) {
        // Already paid, no-op
        return bill;
      }

      if (!dto.accountId) {
        throw new BadRequestException('A payment account is required to mark a bill as PAID.');
      }

      return this.dataSource.transaction(async (manager) => {
        const account = await manager.findOne(FinanceAccountEntity, {
          where: { id: dto.accountId, storeId },
        });

        if (!account) {
          throw new BadRequestException('Specified payment account not found.');
        }

        const balDue = Number(bill.balanceDue || 0);
        const amountToPay = balDue > 0 ? balDue : Number(bill.totalAmount || 0);

        if (amountToPay <= 0) {
          throw new BadRequestException('Bill has a balance of 0 and cannot be paid.');
        }

        // Deduct balance from the selected account
        const currentBal = Number(account.currentBalance || 0);
        account.currentBalance = String((currentBal - amountToPay).toFixed(2));
        await manager.save(FinanceAccountEntity, account);

        // Generate transaction number
        const count = await manager.count(FinanceTransactionEntity, { where: { storeId } });
        const transactionNumber = `TXN-${String(count + 1).padStart(6, '0')}`;
        const transactionDate = dto.paymentDate || new Date().toISOString().split('T')[0];

        // Create EXPENSE transaction in fin_transactions
        const txn = manager.create(FinanceTransactionEntity, {
          tenantId: bill.tenantId,
          storeId,
          transactionNumber,
          type: FinanceTransactionTypeEnum.EXPENSE,
          amount: String(amountToPay),
          currency: bill.currency || 'BDT',
          transactionDate,
          accountId: account.id,
          categoryCode: bill.category || 'COGS',
          description: dto.notes
            ? `Bill Payment for #${bill.billNumber} to ${bill.supplierName} - ${dto.notes}`
            : `Bill Payment for #${bill.billNumber} to ${bill.supplierName}`,
          reference: dto.reference || bill.billNumber,
          sourceType: FinanceSourceTypeEnum.BILL,
          sourceId: bill.id,
          paymentMethod: dto.paymentMethod || account.type,
          status: FinanceTransactionStatusEnum.COMPLETED,
          createdByUserId: userId || null,
        });

        const savedTxn = await manager.save(FinanceTransactionEntity, txn);

        // Update Bill
        bill.paidAmount = bill.totalAmount;
        bill.balanceDue = '0';
        bill.status = FinanceBillStatusEnum.PAID;
        const updatedBill = await manager.save(FinanceBillEntity, bill);

        // Sync to Double-Entry General Ledger (AP Debit, Cash/Bank Asset Credit)
        try {
          await this.syncModuleFinanceService.syncSupplierPayment({
            tenantId: bill.tenantId,
            storeId,
            paymentId: savedTxn.id,
            paymentNumber: savedTxn.transactionNumber,
            billId: bill.id,
            billNumber: bill.billNumber,
            supplierId: bill.supplierName,
            supplierName: bill.supplierName,
            amount: amountToPay,
            paymentDate: savedTxn.transactionDate,
            paymentMethod: savedTxn.paymentMethod,
          });
        } catch {
          // Logged inside sync service, non-blocking
        }

        return updatedBill;
      });
    }

    // 2. Reverting from PAID to another status (e.g. PENDING, UNPAID, VOID)
    if (wasPaid && !isPaying) {
      return this.dataSource.transaction(async (manager) => {
        const existingTxns = await manager.find(FinanceTransactionEntity, {
          where: { storeId, sourceType: FinanceSourceTypeEnum.BILL, sourceId: bill.id },
        });

        for (const txn of existingTxns) {
          if (txn.accountId) {
            const acc = await manager.findOne(FinanceAccountEntity, {
              where: { id: txn.accountId, storeId },
            });
            if (acc) {
              const currentBal = Number(acc.currentBalance || 0);
              acc.currentBalance = String((currentBal + Number(txn.amount)).toFixed(2));
              await manager.save(FinanceAccountEntity, acc);
            }
          }
          await manager.remove(FinanceTransactionEntity, txn);
        }

        bill.paidAmount = '0';
        bill.balanceDue = bill.totalAmount;
        bill.status = newStatus;
        return manager.save(FinanceBillEntity, bill);
      });
    }

    // 3. Status transition between non-paid statuses (e.g. PENDING -> VOID, DRAFT, OVERDUE)
    bill.status = newStatus;
    return this.billRepository.save(bill);
  }
}
