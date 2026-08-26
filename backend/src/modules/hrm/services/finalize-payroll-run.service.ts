import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollRunEntity, PayrollRunStatusEnum } from '../entities/payroll-run.entity';

@Injectable()
export class FinalizePayrollRunService {
  constructor(
    @InjectRepository(PayrollRunEntity)
    private readonly payrollRunRepository: Repository<PayrollRunEntity>,
  ) {}

  async execute(storeId: string, runId: string): Promise<PayrollRunEntity> {
    const run = await this.payrollRunRepository.findOne({ where: { id: runId, storeId } });
    if (!run) {
      throw new NotFoundException('Payroll run not found.');
    }

    if (run.status !== PayrollRunStatusEnum.DRAFT) {
      throw new BadRequestException('Only a draft payroll run can be finalized.');
    }

    run.status = PayrollRunStatusEnum.FINALIZED;
    run.finalizedAt = new Date();

    return this.payrollRunRepository.save(run);
  }
}
