import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobPostingEntity, JobPostingStatusEnum } from '../entities/job-posting.entity';
import { DepartmentEntity } from '../entities/department.entity';
import { UpdateJobPostingDto } from '../dto/recruitment.dto';

@Injectable()
export class UpdateJobPostingService {
  constructor(
    @InjectRepository(JobPostingEntity)
    private readonly jobPostingRepository: Repository<JobPostingEntity>,
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
  ) {}

  async execute(storeId: string, jobPostingId: string, dto: UpdateJobPostingDto): Promise<JobPostingEntity> {
    const jobPosting = await this.jobPostingRepository.findOne({ where: { id: jobPostingId, storeId } });
    if (!jobPosting) {
      throw new NotFoundException('Job posting not found.');
    }

    if (dto.departmentId) {
      const department = await this.departmentRepository.findOne({
        where: { id: dto.departmentId, storeId },
      });
      if (!department) {
        throw new BadRequestException('Selected department was not found for this store.');
      }
    }

    Object.assign(jobPosting, dto);
    if (dto.status === JobPostingStatusEnum.CLOSED && !jobPosting.closedAt) {
      jobPosting.closedAt = new Date();
    }

    return this.jobPostingRepository.save(jobPosting);
  }
}
