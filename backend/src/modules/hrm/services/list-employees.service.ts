import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '../entities/employee.entity';
import { ListEmployeesQueryDto } from '../dto/list-employees-query.dto';

export interface PaginatedEmployees {
  items: EmployeeEntity[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ListEmployeesService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
  ) {}

  async execute(storeId: string, query: ListEmployeesQueryDto): Promise<PaginatedEmployees> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.department', 'department')
      .where('employee.storeId = :storeId', { storeId });

    if (query.departmentId) {
      qb.andWhere('employee.departmentId = :departmentId', { departmentId: query.departmentId });
    }

    if (query.status) {
      qb.andWhere('employee.employmentStatus = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere(
        '(employee.fullName ILIKE :search OR employee.employeeCode ILIKE :search OR employee.email ILIKE :search OR employee.phone ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [items, total] = await qb
      .orderBy('employee.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }
}
