import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalaryStructureEntity } from '../entities/salary-structure.entity';
import { EmployeeEntity } from '../entities/employee.entity';
import { SetSalaryStructureDto } from '../dto/payroll.dto';

@Injectable()
export class SetSalaryStructureService {
  constructor(
    @InjectRepository(SalaryStructureEntity)
    private readonly salaryStructureRepository: Repository<SalaryStructureEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
  ) {}

  async execute(tenantId: string, storeId: string, employeeId: string, dto: SetSalaryStructureDto): Promise<SalaryStructureEntity> {
    const employee = await this.employeeRepository.findOne({ where: { id: employeeId, storeId } });
    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    let structure = await this.salaryStructureRepository.findOne({ where: { employeeId } });
    if (!structure) {
      structure = this.salaryStructureRepository.create({ tenantId, storeId, employeeId });
    }

    structure.basicSalary = dto.basicSalary;
    structure.houseRentAllowance = dto.houseRentAllowance ?? '0';
    structure.medicalAllowance = dto.medicalAllowance ?? '0';
    structure.conveyanceAllowance = dto.conveyanceAllowance ?? '0';
    structure.otherAllowance = dto.otherAllowance ?? '0';
    structure.providentFundDeduction = dto.providentFundDeduction ?? '0';

    return this.salaryStructureRepository.save(structure);
  }
}
