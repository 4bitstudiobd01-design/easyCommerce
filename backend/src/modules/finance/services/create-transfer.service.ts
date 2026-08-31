import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceTransferEntity } from '../entities/finance-transfer.entity';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { CreateFinanceTransferDto } from '../dto/transfer.dto';
import {
  FinanceTransferStatusEnum,
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceSourceTypeEnum,
} from '../enums/finance.enums';

@Injectable()
export class CreateTransferService {
  constructor(
    @InjectRepository(FinanceTransferEntity)
    private readonly transferRepository: Repository<FinanceTransferEntity>,
    @InjectRepository(FinanceAccountEntity)
    private readonly accountRepository: Repository<FinanceAccountEntity>,
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    userId: string,
    dto: CreateFinanceTransferDto,
  ): Promise<FinanceTransferEntity> {
    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException('Source and destination accounts cannot be the same.');
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('Transfer amount must be greater than 0.');
    }

    const fromAccount = await this.accountRepository.findOne({
      where: { id: dto.fromAccountId, storeId },
    });
    if (!fromAccount) {
      throw new BadRequestException('Source account not found.');
    }

    const toAccount = await this.accountRepository.findOne({
      where: { id: dto.toAccountId, storeId },
    });
    if (!toAccount) {
      throw new BadRequestException('Destination account not found.');
    }

    const fee = dto.fee || 0;
    const totalDeduction = dto.amount + fee;
    const fromBal = Number(fromAccount.currentBalance || 0);

    if (fromBal < totalDeduction) {
      throw new BadRequestException(
        `Insufficient balance in ${fromAccount.name}. Available: ${fromBal}, Required: ${totalDeduction}`,
      );
    }

    // Deduct from source and credit destination
    fromAccount.currentBalance = String(fromBal - totalDeduction);
    toAccount.currentBalance = String(Number(toAccount.currentBalance || 0) + dto.amount);

    await this.accountRepository.save(fromAccount);
    await this.accountRepository.save(toAccount);

    const count = await this.transferRepository.count({ where: { storeId } });
    const transferNumber = `TRF-${String(count + 1).padStart(5, '0')}`;

    const transfer = this.transferRepository.create({
      tenantId,
      storeId,
      transferNumber,
      fromAccountId: dto.fromAccountId,
      toAccountId: dto.toAccountId,
      amount: String(dto.amount),
      fee: String(fee),
      currency: fromAccount.currency,
      transferDate: dto.transferDate,
      reference: dto.reference,
      notes: dto.notes,
      status: FinanceTransferStatusEnum.COMPLETED,
      createdByUserId: userId,
    });

    const savedTransfer = await this.transferRepository.save(transfer);

    // Record non-income/expense TRANSFER transaction in the journal
    const txnCount = await this.transactionRepository.count({ where: { storeId } });
    const txn = this.transactionRepository.create({
      tenantId,
      storeId,
      transactionNumber: `TXN-${String(txnCount + 1).padStart(6, '0')}`,
      type: FinanceTransactionTypeEnum.TRANSFER,
      amount: String(dto.amount),
      currency: fromAccount.currency,
      transactionDate: dto.transferDate,
      accountId: dto.fromAccountId,
      toAccountId: dto.toAccountId,
      description: `Transfer from ${fromAccount.name} to ${toAccount.name}${dto.notes ? ' - ' + dto.notes : ''}`,
      reference: dto.reference || transferNumber,
      sourceType: FinanceSourceTypeEnum.TRANSFER,
      sourceId: savedTransfer.id,
      status: FinanceTransactionStatusEnum.COMPLETED,
      createdByUserId: userId,
    });
    await this.transactionRepository.save(txn);

    // If there is a fee, record fee as bank charge / software expense
    if (fee > 0) {
      const feeTxn = this.transactionRepository.create({
        tenantId,
        storeId,
        transactionNumber: `TXN-${String(txnCount + 2).padStart(6, '0')}`,
        type: FinanceTransactionTypeEnum.EXPENSE,
        amount: String(fee),
        currency: fromAccount.currency,
        transactionDate: dto.transferDate,
        accountId: dto.fromAccountId,
        categoryCode: 'OTHER',
        description: `Transfer fee for ${transferNumber}`,
        reference: transferNumber,
        sourceType: FinanceSourceTypeEnum.TRANSFER,
        sourceId: savedTransfer.id,
        status: FinanceTransactionStatusEnum.COMPLETED,
        createdByUserId: userId,
      });
      await this.transactionRepository.save(feeTxn);
    }

    return savedTransfer;
  }
}
