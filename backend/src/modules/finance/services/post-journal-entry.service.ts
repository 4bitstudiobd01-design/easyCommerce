import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FinanceJournalEntryEntity } from '../entities/finance-journal-entry.entity';
import { FinanceJournalLineEntity } from '../entities/finance-journal-line.entity';
import { FinanceChartOfAccountEntity } from '../entities/finance-chart-of-account.entity';
import { CreateJournalEntryDto } from '../dto/journal-entry.dto';
import {
  FinanceJournalEntryTypeEnum,
  FinanceJournalStatusEnum,
  FinanceLineTypeEnum,
  FinanceNormalBalanceEnum,
} from '../enums/finance.enums';
import { PeriodLockService } from './period-lock.service';

export interface AuditContext {
  userId?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

@Injectable()
export class PostJournalEntryService {
  constructor(
    @InjectRepository(FinanceJournalEntryEntity)
    private readonly journalEntryRepository: Repository<FinanceJournalEntryEntity>,
    @InjectRepository(FinanceChartOfAccountEntity)
    private readonly coaRepository: Repository<FinanceChartOfAccountEntity>,
    private readonly periodLockService: PeriodLockService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    dto: CreateJournalEntryDto,
    auditCtx?: AuditContext,
  ): Promise<FinanceJournalEntryEntity> {
    if (!dto.lines || dto.lines.length < 2) {
      throw new BadRequestException('A journal entry must have at least two line items (one debit and one credit).');
    }

    // 1. Period Lock Check
    const isLocked = await this.periodLockService.isDateLocked(storeId, dto.entryDate);
    if (isLocked) {
      throw new BadRequestException(
        `Cannot post transaction on ${dto.entryDate} because the accounting period is locked.`,
      );
    }

    // 2. Compute Debits and Credits
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of dto.lines) {
      const amt = Number(line.amount || 0);
      if (amt <= 0) {
        throw new BadRequestException('Journal line amount must be greater than zero.');
      }
      if (line.type === FinanceLineTypeEnum.DEBIT) {
        totalDebit += amt;
      } else if (line.type === FinanceLineTypeEnum.CREDIT) {
        totalCredit += amt;
      }
    }

    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;

    const diff = Math.abs(totalDebit - totalCredit);
    if (diff > 0.01) {
      throw new BadRequestException(
        `Journal entry is out of balance. Total Debits: ৳${totalDebit.toFixed(2)}, Total Credits: ৳${totalCredit.toFixed(2)}, Difference: ৳${diff.toFixed(2)}.`,
      );
    }

    // 2.5. Idempotency Check: if sourceId/sourceReference and sourceType already have an entry, return it
    if (dto.sourceType && dto.sourceId) {
      const existing = await this.journalEntryRepository.findOne({
        where: { storeId, sourceType: dto.sourceType, sourceId: dto.sourceId },
        relations: ['lines'],
      });
      if (existing) {
        return existing;
      }
    }
    if (dto.sourceReference) {
      const existing = await this.journalEntryRepository.findOne({
        where: { storeId, sourceReference: dto.sourceReference },
        relations: ['lines'],
      });
      if (existing) {
        return existing;
      }
    }

    // 3. Generate sequential Entry Number (JE-YYYYMMDD-XXXX)
    const dateCompact = dto.entryDate.replace(/-/g, '');
    const countToday = await this.journalEntryRepository.count({
      where: { storeId },
    });
    const entryNumber = `JE-${dateCompact}-${String(countToday + 1).padStart(4, '0')}`;

    // 4. Atomic Execution inside Transaction
    return this.dataSource.transaction(async (manager) => {
      const entry = manager.create(FinanceJournalEntryEntity, {
        tenantId,
        storeId,
        entryNumber,
        entryDate: dto.entryDate,
        postingDate: new Date(),
        sourceType: dto.sourceType || FinanceJournalEntryTypeEnum.MANUAL,
        sourceId: dto.sourceId,
        sourceReference: dto.sourceReference,
        description: dto.description.trim(),
        notes: dto.notes,
        totalDebit: String(totalDebit),
        totalCredit: String(totalCredit),
        isBalanced: true,
        status: FinanceJournalStatusEnum.POSTED,
        currency: 'BDT',
        postedByUserId: auditCtx?.userId,
        postedByName: auditCtx?.userName,
        auditMetadata: {
          ipAddress: auditCtx?.ipAddress,
          userAgent: auditCtx?.userAgent,
          reason: auditCtx?.reason || 'Journal Entry Creation',
          history: [
            {
              action: 'POSTED',
              timestamp: new Date().toISOString(),
              userId: auditCtx?.userId,
              details: `Posted with debit/credit balance ৳${totalDebit.toFixed(2)}`,
            },
          ],
        },
      });

      const savedEntry = await manager.save(FinanceJournalEntryEntity, entry);
      const createdLines: FinanceJournalLineEntity[] = [];

      for (const lineDto of dto.lines) {
        const account = await manager.findOne(FinanceChartOfAccountEntity, {
          where: { id: lineDto.accountId, storeId },
        });

        if (!account) {
          throw new NotFoundException(`Chart of Account with ID "${lineDto.accountId}" not found.`);
        }

        // Apply Double-Entry Rules to Account Balance
        const currentBal = Number(account.currentBalance || 0);
        const lineAmt = Number(lineDto.amount || 0);

        if (lineDto.type === FinanceLineTypeEnum.DEBIT) {
          if (account.normalBalance === FinanceNormalBalanceEnum.DEBIT) {
            account.currentBalance = String(currentBal + lineAmt);
          } else {
            account.currentBalance = String(currentBal - lineAmt);
          }
        } else if (lineDto.type === FinanceLineTypeEnum.CREDIT) {
          if (account.normalBalance === FinanceNormalBalanceEnum.CREDIT) {
            account.currentBalance = String(currentBal + lineAmt);
          } else {
            account.currentBalance = String(currentBal - lineAmt);
          }
        }

        await manager.save(FinanceChartOfAccountEntity, account);

        const journalLine = manager.create(FinanceJournalLineEntity, {
          tenantId,
          storeId,
          journalEntryId: savedEntry.id,
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
          type: lineDto.type,
          amount: String(lineAmt),
          description: lineDto.description || dto.description,
          partyType: lineDto.partyType,
          partyId: lineDto.partyId,
          partyName: lineDto.partyName,
        });

        createdLines.push(journalLine);
      }

      await manager.save(FinanceJournalLineEntity, createdLines);
      savedEntry.lines = createdLines;

      return savedEntry;
    });
  }
}
