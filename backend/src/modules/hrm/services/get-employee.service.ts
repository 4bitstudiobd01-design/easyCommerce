import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '../entities/employee.entity';

@Injectable()
export class GetEmployeeService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
  ) {}

  async execute(storeId: string, employeeId: string): Promise<EmployeeEntity> {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId, storeId },
      relations: ['department', 'reportsTo'],
    });
    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }
    return employee;
  }
}
