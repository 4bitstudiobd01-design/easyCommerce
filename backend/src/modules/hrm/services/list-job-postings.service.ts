import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobPostingEntity } from '../entities/job-posting.entity';
import { ListJobPostingsQueryDto } from '../dto/recruitment.dto';

@Injectable()
export class ListJobPostingsService {
  constructor(
    @InjectRepository(JobPostingEntity)
    private readonly jobPostingRepository: Repository<JobPostingEntity>,
  ) {}

  async execute(storeId: string, query: ListJobPostingsQueryDto): Promise<JobPostingEntity[]> {
    return this.jobPostingRepository.find({
      where: { storeId, ...(query.status ? { status: query.status } : {}) },
      relations: ['department'],
      order: { createdAt: 'DESC' },
    });
  }
}
