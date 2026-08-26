import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveRequestEntity, LeaveStatusEnum } from '../entities/leave-request.entity';
import { ReviewLeaveRequestDto } from '../dto/leave-request.dto';

@Injectable()
export class ReviewLeaveRequestService {
  constructor(
    @InjectRepository(LeaveRequestEntity)
    private readonly leaveRequestRepository: Repository<LeaveRequestEntity>,
  ) {}

  async execute(storeId: string, requestId: string, reviewerUserId: string, dto: ReviewLeaveRequestDto): Promise<LeaveRequestEntity> {
    const request = await this.leaveRequestRepository.findOne({ where: { id: requestId, storeId } });
    if (!request) {
      throw new NotFoundException('Leave request not found.');
    }

    if (request.status !== LeaveStatusEnum.PENDING) {
      throw new BadRequestException(`This request has already been ${request.status.toLowerCase()}.`);
    }

    request.status = dto.status;
    request.reviewNote = dto.reviewNote;
    request.reviewedByUserId = reviewerUserId;
    request.reviewedAt = new Date();

    return this.leaveRequestRepository.save(request);
  }
}
