import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '../entities/employee.entity';
import { LeaveRequestEntity, LeaveStatusEnum, LeaveTypeEnum } from '../entities/leave-request.entity';
import { GetLeavePolicyService } from './get-leave-policy.service';

export interface LeaveBalanceLine {
  leaveType: LeaveTypeEnum;
  allocated: number;
  used: number;
  remaining: number;
}

@Injectable()
export class GetLeaveBalanceService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(LeaveRequestEntity)
    private readonly leaveRequestRepository: Repository<LeaveRequestEntity>,
    private readonly getLeavePolicyService: GetLeavePolicyService,
  ) {}

  /** Balance is scoped to the calendar year (a request that starts in this year "uses"
   *  its full day count) — a simplification for requests spanning a year boundary,
   *  reasonable given leave requests are typically short and rarely cross Dec 31. */
  async execute(tenantId: string, storeId: string, employeeId: string, year?: number): Promise<LeaveBalanceLine[]> {
    const employee = await this.employeeRepository.findOne({ where: { id: employeeId, storeId } });
    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    const policy = await this.getLeavePolicyService.execute(tenantId, storeId);
    const targetYear = year ?? new Date().getFullYear();

    const approvedRequests = await this.leaveRequestRepository.find({
      where: { employeeId, status: LeaveStatusEnum.APPROVED },
    });

    const usedByType: Record<LeaveTypeEnum, number> = {
      [LeaveTypeEnum.EARNED]: 0,
      [LeaveTypeEnum.CASUAL]: 0,
      [LeaveTypeEnum.SICK]: 0,
      [LeaveTypeEnum.UNPAID]: 0,
    };

    for (const request of approvedRequests) {
      if (new Date(request.startDate).getFullYear() === targetYear) {
        usedByType[request.leaveType] += request.totalDays;
      }
    }

    const allocatedByType: Record<LeaveTypeEnum, number> = {
      [LeaveTypeEnum.EARNED]: policy.earnedDaysPerYear,
      [LeaveTypeEnum.CASUAL]: policy.casualDaysPerYear,
      [LeaveTypeEnum.SICK]: policy.sickDaysPerYear,
      [LeaveTypeEnum.UNPAID]: 0,
    };

    // UNPAID has no annual quota — it's approved case-by-case, not tracked against a
    // balance — so it's excluded from this list rather than shown as a false "over limit".
    const quotaTrackedTypes = [LeaveTypeEnum.EARNED, LeaveTypeEnum.CASUAL, LeaveTypeEnum.SICK];

    return quotaTrackedTypes.map((leaveType) => ({
      leaveType,
      allocated: allocatedByType[leaveType],
      used: usedByType[leaveType],
      remaining: allocatedByType[leaveType] - usedByType[leaveType],
    }));
  }
}
