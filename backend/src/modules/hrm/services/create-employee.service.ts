import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '../entities/employee.entity';
import { DepartmentEntity } from '../entities/department.entity';
import { CreateEmployeeDto } from '../dto/create-employee.dto';

@Injectable()
export class CreateEmployeeService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
  ) {}

  async execute(tenantId: string, storeId: string, dto: CreateEmployeeDto): Promise<EmployeeEntity> {
    if (dto.departmentId) {
      const department = await this.departmentRepository.findOne({
        where: { id: dto.departmentId, storeId },
      });
      if (!department) {
        throw new BadRequestException('Selected department was not found for this store.');
      }
    }

    const employeeCode = await this.generateEmployeeCode(storeId);

    return this.employeeRepository.save(
      this.employeeRepository.create({
        tenantId,
        storeId,
        employeeCode,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        departmentId: dto.departmentId,
        designation: dto.designation,
        employmentType: dto.employmentType,
        dateOfJoining: dto.dateOfJoining,
        dateOfBirth: dto.dateOfBirth,
        gender: dto.gender,
        address: dto.address,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
      }),
    );
  }

  /**
   * Sequential per-store code (EMP-0001, EMP-0002, ...). A simple count+1 is good enough
   * at HR-onboarding volumes; unlike order numbers this isn't exposed to customers or hit
   * concurrently at scale, so it doesn't need the dedicated sequence-table approach used
   * for order numbers.
   */
  private async generateEmployeeCode(storeId: string): Promise<string> {
    const count = await this.employeeRepository.count({ where: { storeId } });
    return `EMP-${String(count + 1).padStart(4, '0')}`;
  }
}
