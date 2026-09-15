import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity, EmploymentStatusEnum } from '../entities/employee.entity';
import { SalaryStructureEntity } from '../entities/salary-structure.entity';
import { SeedPayrollDemoDataService } from './seed-payroll-demo-data.service';

export interface SalaryStructureRow {
  employee: EmployeeEntity;
  salaryStructure: SalaryStructureEntity | null;
}

@Injectable()
export class ListSalaryStructuresService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(SalaryStructureEntity)
    private readonly salaryStructureRepository: Repository<SalaryStructureEntity>,
    @Optional()
    private readonly seedPayrollDemoDataService?: SeedPayrollDemoDataService,
  ) {}

  async execute(tenantId: string, storeId: string, userId?: string): Promise<SalaryStructureRow[]> {
    let [employees, structures] = await Promise.all([
      this.employeeRepository.find({
        where: { storeId, employmentStatus: EmploymentStatusEnum.ACTIVE },
        order: { fullName: 'ASC' },
      }),
      this.salaryStructureRepository.find({ where: { storeId } }),
    ]);

    if (
      (employees.length === 0 || structures.length === 0) &&
      process.env.NODE_ENV !== 'production' &&
      this.seedPayrollDemoDataService &&
      tenantId
    ) {
      try {
        await this.seedPayrollDemoDataService.execute(tenantId, storeId, userId);
        [employees, structures] = await Promise.all([
          this.employeeRepository.find({
            where: { storeId, employmentStatus: EmploymentStatusEnum.ACTIVE },
            order: { fullName: 'ASC' },
          }),
          this.salaryStructureRepository.find({ where: { storeId } }),
        ]);
      } catch {
        // Fallback to existing data if seeding encounters any issue
      }
    }

    const structureByEmployeeId = new Map(structures.map((s) => [s.employeeId, s]));

    return employees.map((employee) => ({
      employee,
      salaryStructure: structureByEmployeeId.get(employee.id) ?? null,
    }));
  }
}
