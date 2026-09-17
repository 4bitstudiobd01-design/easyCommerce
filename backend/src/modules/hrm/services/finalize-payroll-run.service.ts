import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PayrollPaymentStatusEnum,
  PayrollRunEntity,
  PayrollRunStatusEnum,
} from '../entities/payroll-run.entity';
import { RecordSyncedFinanceTransactionService } from '../../finance/services/record-synced-finance-transaction.service';
import {
  FinanceSourceTypeEnum,
  FinanceTransactionTypeEnum,
} from '../../finance/enums/finance.enums';

@Injectable()
export class FinalizePayrollRunService {
  constructor(
    @InjectRepository(PayrollRunEntity)
    private readonly payrollRunRepository: Repository<PayrollRunEntity>,
    @Optional()
    private readonly recordSyncedFinanceTransactionService?: RecordSyncedFinanceTransactionService,
  ) {}

  async execute(storeId: string, runId: string, userId?: string): Promise<PayrollRunEntity> {
    const run = await this.payrollRunRepository.findOne({ where: { id: runId, storeId } });
    if (!run) {
      throw new NotFoundException('Payroll run not found.');
    }

    if (run.status !== PayrollRunStatusEnum.DRAFT) {
      throw new BadRequestException('Only a draft payroll run can be approved / finalized.');
    }

    run.status = PayrollRunStatusEnum.FINALIZED;
    run.paymentStatus = PayrollPaymentStatusEnum.UNPAID;
    run.finalizedAt = new Date();
    if (userId) {
      run.approvedByUserId = userId;
    }

    const saved = await this.payrollRunRepository.save(run);

    // Sync approved payroll run to Finance as an accrued liability entry
    if (this.recordSyncedFinanceTransactionService) {
      try {
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December',
        ];
        const monthLabel = monthNames[run.month - 1] || `Month ${run.month}`;

        const financeTxn = await this.recordSyncedFinanceTransactionService.execute({
          tenantId: run.tenantId,
          storeId: run.storeId,
          type: FinanceTransactionTypeEnum.EXPENSE,
          amount: Number(run.totalNetAmount || run.totalGrossAmount || 0),
          currency: 'BDT',
          transactionDate: new Date().toISOString().split('T')[0],
          categoryCode: 'SALARY',
          categoryName: 'Salaries & Payroll',
          description: `Approved Payroll for ${monthLabel} ${run.year} (Payable: ৳${Number(run.totalNetAmount || 0).toLocaleString()})`,
          reference: `PAYROLL-${run.year}-${String(run.month).padStart(2, '0')}`,
          sourceType: FinanceSourceTypeEnum.PAYROLL,
          sourceId: run.id,
        });

        if (financeTxn) {
          saved.financeLiabilityTransactionId = financeTxn.id;
          await this.payrollRunRepository.save(saved);
        }
      } catch (err) {
        console.error('Failed to sync approved payroll to Finance:', err);
      }
    }

    return saved;
  }
}
