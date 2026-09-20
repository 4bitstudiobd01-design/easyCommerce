import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateEntity } from '../entities/candidate.entity';
import { JobPostingEntity } from '../entities/job-posting.entity';
import { CreateCandidateDto } from '../dto/recruitment.dto';

@Injectable()
export class CreateCandidateService {
  constructor(
    @InjectRepository(CandidateEntity)
    private readonly candidateRepository: Repository<CandidateEntity>,
    @InjectRepository(JobPostingEntity)
    private readonly jobPostingRepository: Repository<JobPostingEntity>,
  ) {}

  async execute(tenantId: string, storeId: string, dto: CreateCandidateDto): Promise<CandidateEntity> {
    const jobPosting = await this.jobPostingRepository.findOne({
      where: { id: dto.jobPostingId, storeId },
    });
    if (!jobPosting) {
      throw new BadRequestException('Selected job posting was not found for this store.');
    }

    return this.candidateRepository.save(
      this.candidateRepository.create({
        tenantId,
        storeId,
        jobPostingId: dto.jobPostingId,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        source: dto.source,
        notes: dto.notes,
      }),
    );
  }
}
