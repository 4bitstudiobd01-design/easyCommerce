import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '../entities/employee.entity';
import { DepartmentEntity } from '../entities/department.entity';
import { UpdateEmployeeDto } from '../dto/create-employee.dto';

@Injectable()
export class UpdateEmployeeService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
  ) {}

  async execute(storeId: string, employeeId: string, dto: UpdateEmployeeDto): Promise<EmployeeEntity> {
    const employee = await this.employeeRepository.findOne({ where: { id: employeeId, storeId } });
    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    if (dto.departmentId) {
      const department = await this.departmentRepository.findOne({
        where: { id: dto.departmentId, storeId },
      });
      if (!department) {
        throw new BadRequestException('Selected department was not found for this store.');
      }
    }

    Object.assign(employee, dto);
    return this.employeeRepository.save(employee);
  }
}
