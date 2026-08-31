import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollRunEntity, PayrollRunStatusEnum } from '../entities/payroll-run.entity';
import { RecordSyncedFinanceTransactionService } from '../../finance/services/record-synced-finance-transaction.service';
import {
  FinanceTransactionTypeEnum,
  FinanceSourceTypeEnum,
} from '../../finance/enums/finance.enums';

@Injectable()
export class MarkPayrollRunPaidService {
  constructor(
    @InjectRepository(PayrollRunEntity)
    private readonly payrollRunRepository: Repository<PayrollRunEntity>,
    @Optional()
    private readonly recordSyncedFinanceTransactionService?: RecordSyncedFinanceTransactionService,
  ) {}

  async execute(storeId: string, runId: string): Promise<PayrollRunEntity> {
    const run = await this.payrollRunRepository.findOne({ where: { id: runId, storeId } });
    if (!run) {
      throw new NotFoundException('Payroll run not found.');
    }

    if (run.status !== PayrollRunStatusEnum.FINALIZED) {
      throw new BadRequestException('Only a finalized payroll run can be marked as paid.');
    }

    run.status = PayrollRunStatusEnum.PAID;
    run.paidAt = new Date();

    const saved = await this.payrollRunRepository.save(run);

    if (this.recordSyncedFinanceTransactionService) {
      try {
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December',
        ];
        const monthLabel = monthNames[run.month - 1] || `Month ${run.month}`;

        await this.recordSyncedFinanceTransactionService.execute({
          tenantId: run.tenantId,
          storeId: run.storeId,
          type: FinanceTransactionTypeEnum.EXPENSE,
          amount: Number(run.totalNetAmount || run.totalGrossAmount || 0),
          currency: 'BDT',
          transactionDate: new Date().toISOString().split('T')[0],
          categoryCode: 'SALARY',
          categoryName: 'Salaries & Payroll',
          description: `Payroll for ${monthLabel} ${run.year}`,
          reference: `PAY-${run.year}-${String(run.month).padStart(2, '0')}`,
          sourceType: FinanceSourceTypeEnum.PAYROLL,
          sourceId: run.id,
        });
      } catch (err) {
        console.error('Failed to sync payroll run to Finance:', err);
      }
    }

    return saved;
  }
}

