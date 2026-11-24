import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateEntity, CandidateStageEnum } from '../entities/candidate.entity';
import { UpdateCandidateStageDto } from '../dto/recruitment.dto';

@Injectable()
export class UpdateCandidateStageService {
  constructor(
    @InjectRepository(CandidateEntity)
    private readonly candidateRepository: Repository<CandidateEntity>,
  ) {}

  async execute(storeId: string, candidateId: string, dto: UpdateCandidateStageDto): Promise<CandidateEntity> {
    const candidate = await this.candidateRepository.findOne({ where: { id: candidateId, storeId } });
    if (!candidate) {
      throw new NotFoundException('Candidate not found.');
    }

    candidate.stage = dto.stage;
    if (dto.notes) {
      candidate.notes = dto.notes;
    }
    if (dto.stage === CandidateStageEnum.HIRED && !candidate.hiredAt) {
      candidate.hiredAt = new Date();
    }

    return this.candidateRepository.save(candidate);
  }
}
