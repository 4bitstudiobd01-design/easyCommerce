import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  JournalSourceEnum,
  JournalStatusEnum,
} from '../../accounting/entities/journal-entry.entity';
import { AccountMappingEventEnum } from '../../accounting/entities/account-mapping.entity';
import { PostJournalEntryService } from '../../accounting/services/post-journal-entry.service';
import { SupplierEntity } from '../entities/supplier.entity';
import { BillEntity, BillPaymentStatusEnum } from '../entities/bill.entity';
import {
  SupplierPaymentEntity,
  SupplierPaymentMethodEnum,
} from '../entities/supplier-payment.entity';
import { PurchaseCounterKindEnum } from '../entities/purchase-counter.entity';
import { RecordSupplierPaymentDto } from '../dto/supplier-payment.dto';
import { AllocatePurchaseNumberService } from './allocate-purchase-number.service';
import { PurchasePostingHelper } from './purchase-posting.helper';
import { fromCents, toCents } from './purchase-money.util';
import { SyncModuleFinanceService } from '../../finance/services/sync-module-finance.service';

/**
 * Records money paid to a supplier — against a bill or on account — and, unless the store
 * has auto-post disabled, posts a balanced journal entry:
 *
 *   DEBIT  Accounts Payable       (settle the payable)
 *   CREDIT Cash / Bank            (money out — from the chosen or mapped asset account)
 *
 * When a bill is named, its paidAmount and paymentStatus are recomputed.
 */
@Injectable()
export class RecordSupplierPaymentService {
  constructor(
    @InjectRepository(SupplierPaymentEntity)
    private readonly paymentRepository: Repository<SupplierPaymentEntity>,
    @InjectRepository(SupplierEntity)
    private readonly supplierRepository: Repository<SupplierEntity>,
    @InjectRepository(BillEntity)
    private readonly billRepository: Repository<BillEntity>,
    private readonly allocatePurchaseNumberService: AllocatePurchaseNumberService,
    private readonly postingHelper: PurchasePostingHelper,
    private readonly postJournalEntryService: PostJournalEntryService,
    @Optional()
    private readonly syncModuleFinanceService?: SyncModuleFinanceService,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    dto: RecordSupplierPaymentDto,
    userId: string,
  ): Promise<SupplierPaymentEntity> {
    const supplier = await this.supplierRepository.findOne({
      where: { id: dto.supplierId, storeId },
    });
    if (!supplier) {
      throw new NotFoundException('Supplier not found in this store.');
    }

    const amountCents = toCents(dto.amount);
    if (amountCents <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }

    let bill: BillEntity | null = null;
    if (dto.billId) {
      bill = await this.billRepository.findOne({ where: { id: dto.billId, storeId } });
      if (!bill) {
        throw new NotFoundException('Bill not found in this store.');
      }
      if (bill.supplierId !== supplier.id) {
        throw new BadRequestException('This bill belongs to a different supplier.');
      }
      const outstandingCents = toCents(bill.totalAmount) - toCents(bill.paidAmount);
      if (amountCents > outstandingCents) {
        throw new BadRequestException(
          'Payment exceeds the outstanding balance on this bill.',
        );
      }
    }

    const autoPost = await this.postingHelper.autoPostEnabled(storeId);
    let debitAccountId: string | undefined;
    let creditAccountId: string | undefined;
    if (autoPost) {
      debitAccountId = await this.postingHelper.requireMappedAccountId(
        storeId,
        AccountMappingEventEnum.ACCOUNTS_PAYABLE,
        'Accounts Payable',
      );
      creditAccountId =
        dto.paidFromAccountId ??
        (await this.postingHelper.resolveMappedAccountId(
          storeId,
          AccountMappingEventEnum.CASH,
        )) ??
        (await this.postingHelper.resolveMappedAccountId(
          storeId,
          AccountMappingEventEnum.BANK,
        ));
      if (!creditAccountId) {
        throw new BadRequestException('Select the account this payment was made from.');
      }
    }

    const paymentNumber = await this.allocatePurchaseNumberService.execute(
      tenantId,
      storeId,
      PurchaseCounterKindEnum.PAYMENT,
    );

    const payment = await this.paymentRepository.save(
      this.paymentRepository.create({
        tenantId,
        storeId,
        paymentNumber,
        supplierId: supplier.id,
        supplierName: supplier.name,
        billId: bill?.id,
        paymentDate: dto.paymentDate,
        amount: fromCents(amountCents),
        method: dto.method ?? SupplierPaymentMethodEnum.CASH,
        paidFromAccountId: dto.paidFromAccountId ?? creditAccountId,
        reference: dto.reference?.trim(),
        notes: dto.notes?.trim(),
        createdByUserId: userId,
      }),
    );

    if (autoPost && debitAccountId && creditAccountId) {
      const journalEntry = await this.postJournalEntryService.execute(tenantId, storeId, {
        date: dto.paymentDate,
        description: `Supplier payment ${paymentNumber} — ${supplier.name}`,
        reference: dto.reference?.trim(),
        status: JournalStatusEnum.POSTED,
        source: JournalSourceEnum.SUPPLIER_PAYMENT,
        sourceRef: payment.id,
        createdByUserId: userId,
        lines: [
          { accountId: debitAccountId, debit: dto.amount, memo: 'Settle payable' },
          { accountId: creditAccountId, credit: dto.amount, memo: 'Cash/bank paid' },
        ],
      });
      payment.journalEntryId = journalEntry.id;
      await this.paymentRepository.save(payment);
    }

    if (bill) {
      const newPaidCents = toCents(bill.paidAmount) + amountCents;
      const totalCents = toCents(bill.totalAmount);
      bill.paidAmount = fromCents(newPaidCents);
      bill.paymentStatus =
        newPaidCents >= totalCents
          ? BillPaymentStatusEnum.PAID
          : newPaidCents > 0
            ? BillPaymentStatusEnum.PARTIAL
            : BillPaymentStatusEnum.UNPAID;
      await this.billRepository.save(bill);
    }

    if (this.syncModuleFinanceService) {
      try {
        await this.syncModuleFinanceService.syncSupplierPayment({
          tenantId,
          storeId,
          paymentId: payment.id,
          paymentNumber: payment.paymentNumber,
          billId: bill?.id,
          billNumber: bill?.billNumber,
          supplierId: supplier.id,
          supplierName: supplier.name,
          amount: dto.amount,
          paymentDate: dto.paymentDate,
          paymentMethod: dto.method,
          bankAccountId: dto.paidFromAccountId,
        });
      } catch (err) {
        console.error('Failed to sync supplier payment to Finance:', err);
      }
    }

    return payment;
  }
}
