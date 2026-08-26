import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity, EmploymentStatusEnum } from '../entities/employee.entity';
import { SalaryStructureEntity } from '../entities/salary-structure.entity';

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
  ) {}

  async execute(storeId: string): Promise<SalaryStructureRow[]> {
    const [employees, structures] = await Promise.all([
      this.employeeRepository.find({ where: { storeId, employmentStatus: EmploymentStatusEnum.ACTIVE }, order: { fullName: 'ASC' } }),
      this.salaryStructureRepository.find({ where: { storeId } }),
    ]);

    const structureByEmployeeId = new Map(structures.map((s) => [s.employeeId, s]));

    return employees.map((employee) => ({
      employee,
      salaryStructure: structureByEmployeeId.get(employee.id) ?? null,
    }));
  }
}
