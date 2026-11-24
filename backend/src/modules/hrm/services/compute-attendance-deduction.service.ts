import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { AttendanceEntity, AttendanceStatusEnum } from '../entities/attendance.entity';
import { LeaveRequestEntity, LeaveStatusEnum, LeaveTypeEnum } from '../entities/leave-request.entity';
import { GetAttendanceDeductionPolicyService } from './get-attendance-deduction-policy.service';

export interface AttendanceDeductionResult {
  lateArrivalsCount: number;
  lateDeductionDays: number;
  unpaidLeaveDays: number;
  absentDays: number;
  totalDeductionDays: number;
  perDayRate: number;
  amount: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

@Injectable()
export class ComputeAttendanceDeductionService {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
    @InjectRepository(LeaveRequestEntity)
    private readonly leaveRequestRepository: Repository<LeaveRequestEntity>,
    private readonly getAttendanceDeductionPolicyService: GetAttendanceDeductionPolicyService,
  ) {}

  /**
   * Computes the attendance/leave-based deduction for one employee for a payroll
   * month, at generation time — this is a one-time snapshot, not a live value.
   * perDayRate = grossSalary / (calendar days in that month), per the confirmed
   * design: the rate adapts to 28/29/30/31-day months rather than a fixed divisor.
   */
  async execute(
    tenantId: string,
    storeId: string,
    employeeId: string,
    month: number,
    year: number,
    grossSalary: number,
  ): Promise<AttendanceDeductionResult> {
    const policy = await this.getAttendanceDeductionPolicyService.execute(tenantId, storeId);
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStart = `${year}-${pad(month)}-01`;
    const monthEnd = `${year}-${pad(month)}-${pad(daysInMonth)}`;

    const attendanceRows = await this.attendanceRepository.find({
      where: { employeeId, date: Between(monthStart, monthEnd) },
    });

    const lateArrivalsCount = attendanceRows.filter((row) => row.status === AttendanceStatusEnum.LATE).length;
    const absentDays = policy.deductUnmarkedAbsences
      ? attendanceRows.filter((row) => row.status === AttendanceStatusEnum.ABSENT).length
      : 0;

    const unpaidLeaveRequests = await this.leaveRequestRepository.find({
      where: {
        employeeId,
        leaveType: LeaveTypeEnum.UNPAID,
        status: LeaveStatusEnum.APPROVED,
        startDate: LessThanOrEqual(monthEnd),
        endDate: MoreThanOrEqual(monthStart),
      },
    });

    const monthStartMs = new Date(monthStart).getTime();
    const monthEndMs = new Date(monthEnd).getTime();
    const unpaidLeaveDays = unpaidLeaveRequests.reduce((sum, request) => {
      const start = Math.max(new Date(request.startDate).getTime(), monthStartMs);
      const end = Math.min(new Date(request.endDate).getTime(), monthEndMs);
      const clippedDays = Math.round((end - start) / MS_PER_DAY) + 1;
      return sum + Math.max(clippedDays, 0);
    }, 0);

    const lateDeductionDays = Math.floor(lateArrivalsCount / policy.lateArrivalsPerDeductedDay);
    const totalDeductionDays = lateDeductionDays + unpaidLeaveDays + absentDays;
    const perDayRate = grossSalary / daysInMonth;
    const amount = totalDeductionDays * perDayRate;

    return {
      lateArrivalsCount,
      lateDeductionDays,
      unpaidLeaveDays,
      absentDays,
      totalDeductionDays,
      perDayRate,
      amount,
    };
  }
}
