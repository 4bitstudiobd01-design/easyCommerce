import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateEntity } from '../entities/candidate.entity';
import { ListCandidatesQueryDto } from '../dto/recruitment.dto';

@Injectable()
export class ListCandidatesService {
  constructor(
    @InjectRepository(CandidateEntity)
    private readonly candidateRepository: Repository<CandidateEntity>,
  ) {}

  async execute(storeId: string, query: ListCandidatesQueryDto): Promise<CandidateEntity[]> {
    return this.candidateRepository.find({
      where: {
        storeId,
        ...(query.jobPostingId ? { jobPostingId: query.jobPostingId } : {}),
        ...(query.stage ? { stage: query.stage } : {}),
      },
      relations: ['jobPosting'],
      order: { appliedAt: 'DESC' },
    });
  }
}
