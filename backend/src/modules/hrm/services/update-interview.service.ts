import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewEntity } from '../entities/interview.entity';
import { UpdateInterviewDto } from '../dto/recruitment.dto';

@Injectable()
export class UpdateInterviewService {
  constructor(
    @InjectRepository(InterviewEntity)
    private readonly interviewRepository: Repository<InterviewEntity>,
  ) {}

  async execute(storeId: string, interviewId: string, dto: UpdateInterviewDto): Promise<InterviewEntity> {
    const interview = await this.interviewRepository.findOne({ where: { id: interviewId, storeId } });
    if (!interview) {
      throw new NotFoundException('Interview not found.');
    }

    Object.assign(interview, {
      ...dto,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : interview.scheduledAt,
    });

    return this.interviewRepository.save(interview);
  }
}
