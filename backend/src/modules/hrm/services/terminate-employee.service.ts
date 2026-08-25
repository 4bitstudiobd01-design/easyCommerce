import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity, EmploymentStatusEnum } from '../entities/employee.entity';

@Injectable()
export class TerminateEmployeeService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
  ) {}

  /** Marks the record TERMINATED rather than deleting it — attendance, leave, and payroll
   *  history in later phases will reference this employee and must not be orphaned. */
  async execute(storeId: string, employeeId: string): Promise<EmployeeEntity> {
    const employee = await this.employeeRepository.findOne({ where: { id: employeeId, storeId } });
    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    employee.employmentStatus = EmploymentStatusEnum.TERMINATED;
    return this.employeeRepository.save(employee);
  }
}
