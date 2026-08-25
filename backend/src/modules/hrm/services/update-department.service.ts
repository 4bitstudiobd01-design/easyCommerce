import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentEntity } from '../entities/department.entity';
import { UpdateDepartmentDto } from '../dto/update-department.dto';

@Injectable()
export class UpdateDepartmentService {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
  ) {}

  async execute(storeId: string, departmentId: string, dto: UpdateDepartmentDto): Promise<DepartmentEntity> {
    const department = await this.departmentRepository.findOne({ where: { id: departmentId, storeId } });
    if (!department) {
      throw new NotFoundException('Department not found.');
    }

    if (dto.name && dto.name !== department.name) {
      const existing = await this.departmentRepository.findOne({ where: { storeId, name: dto.name } });
      if (existing) {
        throw new ConflictException(`A department named "${dto.name}" already exists.`);
      }
    }

    Object.assign(department, dto);
    return this.departmentRepository.save(department);
  }
}
