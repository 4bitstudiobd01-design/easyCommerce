import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentEntity } from '../entities/department.entity';
import { CreateDepartmentDto } from '../dto/create-department.dto';

@Injectable()
export class CreateDepartmentService {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
  ) {}

  async execute(tenantId: string, storeId: string, dto: CreateDepartmentDto): Promise<DepartmentEntity> {
    const existing = await this.departmentRepository.findOne({ where: { storeId, name: dto.name } });
    if (existing) {
      throw new ConflictException(`A department named "${dto.name}" already exists.`);
    }

    return this.departmentRepository.save(
      this.departmentRepository.create({
        tenantId,
        storeId,
        name: dto.name,
        description: dto.description,
      }),
    );
  }
}
