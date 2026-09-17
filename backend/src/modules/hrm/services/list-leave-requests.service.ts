import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveRequestEntity } from '../entities/leave-request.entity';
import { ListLeaveRequestsQueryDto } from '../dto/leave-request.dto';

export interface PaginatedLeaveRequests {
  items: LeaveRequestEntity[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ListLeaveRequestsService {
  constructor(
    @InjectRepository(LeaveRequestEntity)
    private readonly leaveRequestRepository: Repository<LeaveRequestEntity>,
  ) {}

  async execute(storeId: string, query: ListLeaveRequestsQueryDto): Promise<PaginatedLeaveRequests> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.leaveRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.employee', 'employee')
      .where('request.storeId = :storeId', { storeId });

    if (query.employeeId) {
      qb.andWhere('request.employeeId = :employeeId', { employeeId: query.employeeId });
    }
    if (query.status) {
      qb.andWhere('request.status = :status', { status: query.status });
    }
    if (query.leaveType) {
      qb.andWhere('request.leaveType = :leaveType', { leaveType: query.leaveType });
    }

    const [items, total] = await qb
      .orderBy('request.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }
}
