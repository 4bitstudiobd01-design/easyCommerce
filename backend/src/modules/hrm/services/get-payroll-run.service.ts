import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollRunEntity } from '../entities/payroll-run.entity';
import { PayslipEntity } from '../entities/payslip.entity';

export interface PayrollRunDetail {
  run: PayrollRunEntity;
  payslips: PayslipEntity[];
}

@Injectable()
export class GetPayrollRunService {
  constructor(
    @InjectRepository(PayrollRunEntity)
    private readonly payrollRunRepository: Repository<PayrollRunEntity>,
    @InjectRepository(PayslipEntity)
    private readonly payslipRepository: Repository<PayslipEntity>,
  ) {}

  async execute(storeId: string, runId: string): Promise<PayrollRunDetail> {
    const run = await this.payrollRunRepository.findOne({ where: { id: runId, storeId } });
    if (!run) {
      throw new NotFoundException('Payroll run not found.');
    }

    const payslips = await this.payslipRepository.find({
      where: { payrollRunId: runId },
      relations: ['employee'],
      order: { createdAt: 'ASC' },
    });

    return { run, payslips };
  }
}
