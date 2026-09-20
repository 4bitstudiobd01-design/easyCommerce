import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateEntity, CandidateStageEnum } from '../entities/candidate.entity';

export interface RecruitmentStats {
  totalApplicants: number;
  hired: number;
  avgDaysToHire: number | null;
  byStage: Record<CandidateStageEnum, number>;
}

@Injectable()
export class GetRecruitmentStatsService {
  constructor(
    @InjectRepository(CandidateEntity)
    private readonly candidateRepository: Repository<CandidateEntity>,
  ) {}

  async execute(storeId: string): Promise<RecruitmentStats> {
    const candidates = await this.candidateRepository.find({ where: { storeId } });

    const byStage: Record<CandidateStageEnum, number> = {
      [CandidateStageEnum.APPLIED]: 0,
      [CandidateStageEnum.SCREENING]: 0,
      [CandidateStageEnum.INTERVIEW]: 0,
      [CandidateStageEnum.OFFER]: 0,
      [CandidateStageEnum.HIRED]: 0,
      [CandidateStageEnum.REJECTED]: 0,
    };
    for (const candidate of candidates) {
      byStage[candidate.stage]++;
    }

    const hiredCandidates = candidates.filter((c) => c.stage === CandidateStageEnum.HIRED && c.hiredAt);
    const avgDaysToHire =
      hiredCandidates.length > 0
        ? Math.round(
            hiredCandidates.reduce((sum, c) => {
              const days = (new Date(c.hiredAt!).getTime() - new Date(c.appliedAt).getTime()) / (1000 * 60 * 60 * 24);
              return sum + days;
            }, 0) / hiredCandidates.length,
          )
        : null;

    return {
      totalApplicants: candidates.length,
      hired: byStage[CandidateStageEnum.HIRED],
      avgDaysToHire,
      byStage,
    };
  }
}
