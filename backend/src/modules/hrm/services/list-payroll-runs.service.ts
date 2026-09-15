import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollRunEntity } from '../entities/payroll-run.entity';
import { ListPayrollRunsQueryDto } from '../dto/payroll.dto';

@Injectable()
export class ListPayrollRunsService {
  constructor(
    @InjectRepository(PayrollRunEntity)
    private readonly payrollRunRepository: Repository<PayrollRunEntity>,
  ) {}

  async execute(storeId: string, query: ListPayrollRunsQueryDto): Promise<PayrollRunEntity[]> {
    return this.payrollRunRepository.find({
      where: { storeId, ...(query.year ? { year: query.year } : {}) },
      order: { year: 'DESC', month: 'DESC' },
    });
  }
}
