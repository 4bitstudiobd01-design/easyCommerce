import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FinanceInvoiceEntity } from '../entities/finance-invoice.entity';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { UpdateFinanceInvoiceStatusDto } from '../dto/invoice.dto';
import {
  FinanceInvoiceStatusEnum,
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceSourceTypeEnum,
} from '../enums/finance.enums';
import { SyncModuleFinanceService } from './sync-module-finance.service';

@Injectable()
export class UpdateInvoiceStatusService {
  constructor(
    @InjectRepository(FinanceInvoiceEntity)
    private readonly invoiceRepository: Repository<FinanceInvoiceEntity>,
    @InjectRepository(FinanceAccountEntity)
    private readonly accountRepository: Repository<FinanceAccountEntity>,
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
    private readonly dataSource: DataSource,
    private readonly syncModuleFinanceService: SyncModuleFinanceService,
  ) {}

  async execute(
    storeId: string,
    invoiceId: string,
    userId: string,
    dto: UpdateFinanceInvoiceStatusDto,
  ): Promise<FinanceInvoiceEntity> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, storeId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found.');
    }

    const wasPaid = invoice.status === FinanceInvoiceStatusEnum.PAID;
    const isPaying = dto.status === FinanceInvoiceStatusEnum.PAID;
    const newStatus = dto.status;

    // 1. Marking as PAID
    if (isPaying) {
      if (wasPaid) {
        // Already paid, no-op
        return invoice;
      }

      if (!dto.accountId) {
        throw new BadRequestException('A receiving account is required to mark an invoice as PAID.');
      }

      return this.dataSource.transaction(async (manager) => {
        const account = await manager.findOne(FinanceAccountEntity, {
          where: { id: dto.accountId, storeId },
        });

        if (!account) {
          throw new BadRequestException('Specified receiving account not found.');
        }

        const balDue = Number(invoice.balanceDue || 0);
        const amountToReceive = balDue > 0 ? balDue : Number(invoice.totalAmount || 0);

        if (amountToReceive <= 0) {
          throw new BadRequestException('Invoice has a balance of 0 and cannot be paid.');
        }

        // Add funds to the selected account
        const currentBal = Number(account.currentBalance || 0);
        account.currentBalance = String((currentBal + amountToReceive).toFixed(2));
        await manager.save(FinanceAccountEntity, account);

        // Generate transaction number
        const count = await manager.count(FinanceTransactionEntity, { where: { storeId } });
        const transactionNumber = `TXN-${String(count + 1).padStart(6, '0')}`;
        const transactionDate = dto.paymentDate || new Date().toISOString().split('T')[0];

        // Create INCOME transaction in fin_transactions
        const txn = manager.create(FinanceTransactionEntity, {
          tenantId: invoice.tenantId,
          storeId,
          transactionNumber,
          type: FinanceTransactionTypeEnum.INCOME,
          amount: String(amountToReceive),
          currency: invoice.currency || 'BDT',
          transactionDate,
          accountId: account.id,
          categoryCode: 'PRODUCT_SALES',
          description: dto.notes
            ? `Payment received for Invoice #${invoice.invoiceNumber} from ${invoice.customerName} - ${dto.notes}`
            : `Payment received for Invoice #${invoice.invoiceNumber} from ${invoice.customerName}`,
          reference: dto.reference || invoice.invoiceNumber,
          sourceType: FinanceSourceTypeEnum.INVOICE,
          sourceId: invoice.id,
          paymentMethod: dto.paymentMethod || account.type,
          status: FinanceTransactionStatusEnum.COMPLETED,
          createdByUserId: userId || null,
        });

        const savedTxn = await manager.save(FinanceTransactionEntity, txn);

        // Update Invoice
        invoice.paidAmount = invoice.totalAmount;
        invoice.balanceDue = '0';
        invoice.status = FinanceInvoiceStatusEnum.PAID;
        const updatedInvoice = await manager.save(FinanceInvoiceEntity, invoice);

        // Sync to Double-Entry General Ledger (Cash/Bank Asset Debit, AR Credit)
        try {
          await this.syncModuleFinanceService.syncCustomerInvoicePayment({
            tenantId: invoice.tenantId,
            storeId,
            paymentId: savedTxn.id,
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.customerName,
            amount: amountToReceive,
            paymentDate: savedTxn.transactionDate,
            paymentMethod: savedTxn.paymentMethod,
            accountId: account.id,
          });
        } catch {
          // Logged inside sync service, non-blocking
        }

        return updatedInvoice;
      });
    }

    // 2. Reverting from PAID to another status (e.g. PENDING, UNPAID, VOID)
    if (wasPaid && !isPaying) {
      return this.dataSource.transaction(async (manager) => {
        const existingTxns = await manager.find(FinanceTransactionEntity, {
          where: { storeId, sourceType: FinanceSourceTypeEnum.INVOICE, sourceId: invoice.id },
        });

        for (const txn of existingTxns) {
          if (txn.accountId) {
            const acc = await manager.findOne(FinanceAccountEntity, {
              where: { id: txn.accountId, storeId },
            });
            if (acc) {
              const currentBal = Number(acc.currentBalance || 0);
              acc.currentBalance = String((currentBal - Number(txn.amount)).toFixed(2));
              await manager.save(FinanceAccountEntity, acc);
            }
          }
          await manager.remove(FinanceTransactionEntity, txn);
        }

        invoice.paidAmount = '0';
        invoice.balanceDue = invoice.totalAmount;
        invoice.status = newStatus;
        return manager.save(FinanceInvoiceEntity, invoice);
      });
    }

    // 3. Status transition between non-paid statuses (e.g. PENDING -> VOID, DRAFT, OVERDUE)
    invoice.status = newStatus;
    return this.invoiceRepository.save(invoice);
  }
}
