import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentEntity } from '../entities/department.entity';

@Injectable()
export class DeleteDepartmentService {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
  ) {}

  /** Employees in this department are unassigned (departmentId set null) rather than deleted. */
  async execute(storeId: string, departmentId: string): Promise<void> {
    const department = await this.departmentRepository.findOne({ where: { id: departmentId, storeId } });
    if (!department) {
      throw new NotFoundException('Department not found.');
    }

    await this.departmentRepository.remove(department);
  }
}
