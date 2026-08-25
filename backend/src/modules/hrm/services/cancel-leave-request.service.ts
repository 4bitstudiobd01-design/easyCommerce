import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveRequestEntity, LeaveStatusEnum } from '../entities/leave-request.entity';

@Injectable()
export class CancelLeaveRequestService {
  constructor(
    @InjectRepository(LeaveRequestEntity)
    private readonly leaveRequestRepository: Repository<LeaveRequestEntity>,
  ) {}

  /** restrictToEmployeeId scopes the lookup to one employee's own requests — used by the
   *  self-service endpoints so an hr:leave:self holder can only ever touch their own row. */
  async execute(storeId: string, requestId: string, restrictToEmployeeId?: string): Promise<LeaveRequestEntity> {
    const request = await this.leaveRequestRepository.findOne({
      where: { id: requestId, storeId, ...(restrictToEmployeeId ? { employeeId: restrictToEmployeeId } : {}) },
    });
    if (!request) {
      throw new NotFoundException('Leave request not found.');
    }

    if (request.status !== LeaveStatusEnum.PENDING) {
      throw new BadRequestException('Only a pending request can be cancelled.');
    }

    request.status = LeaveStatusEnum.CANCELLED;
    return this.leaveRequestRepository.save(request);
  }
}
