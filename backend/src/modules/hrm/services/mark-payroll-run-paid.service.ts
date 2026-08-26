import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollRunEntity, PayrollRunStatusEnum } from '../entities/payroll-run.entity';

@Injectable()
export class MarkPayrollRunPaidService {
  constructor(
    @InjectRepository(PayrollRunEntity)
    private readonly payrollRunRepository: Repository<PayrollRunEntity>,
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

    return this.payrollRunRepository.save(run);
  }
}
