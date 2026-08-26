import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentEntity } from '../entities/department.entity';

@Injectable()
export class ListDepartmentsService {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
  ) {}

  async execute(storeId: string): Promise<DepartmentEntity[]> {
    return this.departmentRepository.find({
      where: { storeId },
      order: { name: 'ASC' },
    });
  }
}
