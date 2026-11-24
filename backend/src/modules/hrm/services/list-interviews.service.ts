import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { InterviewEntity, InterviewStatusEnum } from '../entities/interview.entity';
import { ListInterviewsQueryDto } from '../dto/recruitment.dto';

@Injectable()
export class ListInterviewsService {
  constructor(
    @InjectRepository(InterviewEntity)
    private readonly interviewRepository: Repository<InterviewEntity>,
  ) {}

  async execute(storeId: string, query: ListInterviewsQueryDto): Promise<InterviewEntity[]> {
    const limit = query.limit ?? 20;

    if (query.upcoming) {
      return this.interviewRepository.find({
        where: { storeId, status: InterviewStatusEnum.SCHEDULED, scheduledAt: MoreThanOrEqual(new Date()) },
        relations: ['candidate', 'candidate.jobPosting'],
        order: { scheduledAt: 'ASC' },
        take: limit,
      });
    }

    return this.interviewRepository.find({
      where: { storeId },
      relations: ['candidate', 'candidate.jobPosting'],
      order: { scheduledAt: 'DESC' },
      take: limit,
    });
  }
}
