import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollRunEntity } from '../entities/payroll-run.entity';
import { ListPayrollRunsQueryDto } from '../dto/payroll.dto';
import { SeedPayrollDemoDataService } from './seed-payroll-demo-data.service';

@Injectable()
export class ListPayrollRunsService {
  constructor(
    @InjectRepository(PayrollRunEntity)
    private readonly payrollRunRepository: Repository<PayrollRunEntity>,
    @Optional()
    private readonly seedPayrollDemoDataService?: SeedPayrollDemoDataService,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    query: ListPayrollRunsQueryDto,
    userId?: string,
  ): Promise<PayrollRunEntity[]> {
    let runs = await this.payrollRunRepository.find({
      where: { storeId, ...(query.year ? { year: query.year } : {}) },
      order: { year: 'DESC', month: 'DESC' },
    });

    if (runs.length === 0 && process.env.NODE_ENV !== 'production' && this.seedPayrollDemoDataService && tenantId) {
      try {
        await this.seedPayrollDemoDataService.execute(tenantId, storeId, userId);
        runs = await this.payrollRunRepository.find({
          where: { storeId, ...(query.year ? { year: query.year } : {}) },
          order: { year: 'DESC', month: 'DESC' },
        });
      } catch {
        // Fallback to empty array if seeder encounters any conflict or issue
      }
    }

    return runs;
  }
}
