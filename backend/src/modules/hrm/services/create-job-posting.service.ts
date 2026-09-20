import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobPostingEntity } from '../entities/job-posting.entity';
import { DepartmentEntity } from '../entities/department.entity';
import { CreateJobPostingDto } from '../dto/recruitment.dto';

@Injectable()
export class CreateJobPostingService {
  constructor(
    @InjectRepository(JobPostingEntity)
    private readonly jobPostingRepository: Repository<JobPostingEntity>,
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
  ) {}

  async execute(tenantId: string, storeId: string, dto: CreateJobPostingDto): Promise<JobPostingEntity> {
    if (dto.departmentId) {
      const department = await this.departmentRepository.findOne({
        where: { id: dto.departmentId, storeId },
      });
      if (!department) {
        throw new BadRequestException('Selected department was not found for this store.');
      }
    }

    return this.jobPostingRepository.save(
      this.jobPostingRepository.create({
        tenantId,
        storeId,
        title: dto.title,
        departmentId: dto.departmentId,
        employmentType: dto.employmentType,
        location: dto.location,
        openings: dto.openings ?? 1,
        description: dto.description,
      }),
    );
  }
}
