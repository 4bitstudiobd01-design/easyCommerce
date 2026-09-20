import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateEntity } from '../entities/candidate.entity';

@Injectable()
export class DeleteCandidateService {
  constructor(
    @InjectRepository(CandidateEntity)
    private readonly candidateRepository: Repository<CandidateEntity>,
  ) {}

  async execute(storeId: string, candidateId: string): Promise<{ success: boolean }> {
    const candidate = await this.candidateRepository.findOne({ where: { id: candidateId, storeId } });
    if (!candidate) {
      throw new NotFoundException('Candidate not found.');
    }

    await this.candidateRepository.remove(candidate);
    return { success: true };
  }
}
