import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FinanceRequisitionEntity } from '../entities/finance-requisition.entity';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import {
  PurchaseOrderEntity,
  PurchaseOrderPaymentStatusEnum,
  PurchaseOrderStatusEnum,
} from '../../purchase/entities/purchase-order.entity';
import { ApproveFinanceRequisitionDto } from '../dto/finance-requisition.dto';
import {
  FinanceRequisitionStatusEnum,
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceSourceTypeEnum,
} from '../enums/finance.enums';

@Injectable()
export class ApproveRequisitionService {
  constructor(private readonly dataSource: DataSource) {}

  async execute(
    tenantId: string,
    storeId: string,
    userId: string,
    userName: string | undefined,
    requisitionId: string,
    dto: ApproveFinanceRequisitionDto,
  ): Promise<FinanceRequisitionEntity> {
    return this.dataSource.transaction(async (manager) => {
      const reqRepo = manager.getRepository(FinanceRequisitionEntity);
      const accRepo = manager.getRepository(FinanceAccountEntity);
      const txnRepo = manager.getRepository(FinanceTransactionEntity);
      const poRepo = manager.getRepository(PurchaseOrderEntity);

      const requisition = await reqRepo.findOne({
        where: { id: requisitionId, storeId },
      });

      if (!requisition) {
        throw new NotFoundException('Requisition not found.');
      }

      if (requisition.status === FinanceRequisitionStatusEnum.APPROVED) {
        throw new BadRequestException('This requisition is already approved.');
      }

      if (requisition.status === FinanceRequisitionStatusEnum.REJECTED) {
        throw new BadRequestException('Cannot approve a rejected requisition.');
      }

      const account = await accRepo.findOne({
        where: { id: dto.accountId, storeId },
      });

      if (!account) {
        throw new BadRequestException('Selected payment account not found.');
      }

      const amountToDisburse = Number(requisition.requestedAmount);
      if (amountToDisburse <= 0) {
        throw new BadRequestException('Requisition requested amount must be positive.');
      }

      // 1. Generate Transaction Number
      const txnCount = await txnRepo.count({ where: { storeId } });
      const transactionNumber = `TXN-${String(txnCount + 1).padStart(6, '0')}`;
      const today = new Date().toISOString().split('T')[0];

      // Auto-resolve paymentMethod from account type if not provided
      let resolvedPaymentMethod = dto.paymentMethod;
      if (!resolvedPaymentMethod) {
        if (account.type === 'CASH') resolvedPaymentMethod = 'CASH';
        else if (account.type === 'DIGITAL_WALLET') resolvedPaymentMethod = 'MOBILE_BANKING';
        else if (account.type === 'CARD') resolvedPaymentMethod = 'CARD';
        else resolvedPaymentMethod = 'BANK_TRANSFER';
      }

      // 2. Create Expense Transaction in Finance Ledger
      const txn = txnRepo.create({
        tenantId,
        storeId,
        transactionNumber,
        type: FinanceTransactionTypeEnum.EXPENSE,
        amount: String(amountToDisburse),
        currency: 'BDT',
        transactionDate: today,
        accountId: account.id,
        categoryCode: 'PURCHASE',
        description: `Disbursement for ${requisition.requisitionNumber} (${requisition.title})`,
        reference: dto.paymentReference || requisition.requisitionNumber,
        sourceType: FinanceSourceTypeEnum.REQUISITION,
        sourceId: requisition.id,
        paymentMethod: resolvedPaymentMethod,
        status: FinanceTransactionStatusEnum.COMPLETED,
        createdByUserId: userId,
      });

      const savedTxn = await txnRepo.save(txn);

      // 3. Deduct from Account Balance
      const currentBalance = Number(account.currentBalance || 0);
      account.currentBalance = String(currentBalance - amountToDisburse);
      await accRepo.save(account);

      // 4. Update Requisition
      requisition.status = FinanceRequisitionStatusEnum.APPROVED;
      requisition.paidFromAccountId = account.id;
      requisition.disbursedAmount = String(amountToDisburse);
      requisition.financeTransactionId = savedTxn.id;
      requisition.paymentMethod = dto.paymentMethod || 'BANK_TRANSFER';
      requisition.paymentReference = dto.paymentReference || savedTxn.transactionNumber;
      requisition.approvedAt = new Date();
      requisition.approvedByUserId = userId;
      requisition.approvedByName = userName;
      if (dto.notes?.trim()) {
        requisition.notes = (
          (requisition.notes || '') +
          `\n[Approval note]: ${dto.notes.trim()}`
        ).trim();
      }

      const savedRequisition = await reqRepo.save(requisition);

      // 5. Update linked Purchase Order to APPROVED
      if (requisition.purchaseOrderId) {
        const po = await poRepo.findOne({
          where: { id: requisition.purchaseOrderId, storeId },
        });

        if (po) {
          po.status = PurchaseOrderStatusEnum.SENT;
          po.paymentStatus = PurchaseOrderPaymentStatusEnum.PAID;
          const approvalNote = `\n[Finance Approved: ৳${amountToDisburse.toLocaleString(
            'en-US',
            { minimumFractionDigits: 2 },
          )} disbursed from ${account.name} on ${today} (Ref: ${
            savedTxn.transactionNumber
          })]`;
          po.notes = ((po.notes || '') + approvalNote).trim();
          await poRepo.save(po);
        }
      }

      return savedRequisition;
    });
  }
}
