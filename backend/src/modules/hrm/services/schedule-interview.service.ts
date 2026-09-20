import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewEntity } from '../entities/interview.entity';
import { CandidateEntity, CandidateStageEnum } from '../entities/candidate.entity';
import { ScheduleInterviewDto } from '../dto/recruitment.dto';

@Injectable()
export class ScheduleInterviewService {
  constructor(
    @InjectRepository(InterviewEntity)
    private readonly interviewRepository: Repository<InterviewEntity>,
    @InjectRepository(CandidateEntity)
    private readonly candidateRepository: Repository<CandidateEntity>,
  ) {}

  async execute(tenantId: string, storeId: string, dto: ScheduleInterviewDto): Promise<InterviewEntity> {
    const candidate = await this.candidateRepository.findOne({
      where: { id: dto.candidateId, storeId },
    });
    if (!candidate) {
      throw new BadRequestException('Selected candidate was not found for this store.');
    }

    const interview = await this.interviewRepository.save(
      this.interviewRepository.create({
        tenantId,
        storeId,
        candidateId: dto.candidateId,
        scheduledAt: new Date(dto.scheduledAt),
        durationMinutes: dto.durationMinutes ?? 30,
        interviewerNames: dto.interviewerNames,
        meetingLink: dto.meetingLink,
      }),
    );

    if (candidate.stage === CandidateStageEnum.APPLIED || candidate.stage === CandidateStageEnum.SCREENING) {
      candidate.stage = CandidateStageEnum.INTERVIEW;
      await this.candidateRepository.save(candidate);
    }

    return interview;
  }
}
