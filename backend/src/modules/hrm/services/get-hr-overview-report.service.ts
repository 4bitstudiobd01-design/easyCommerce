import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, MoreThanOrEqual, Repository } from 'typeorm';
import { EmployeeEntity, EmploymentStatusEnum, EmploymentTypeEnum } from '../entities/employee.entity';
import { AttendanceEntity, AttendanceStatusEnum } from '../entities/attendance.entity';
import { LeaveRequestEntity, LeaveStatusEnum, LeaveTypeEnum } from '../entities/leave-request.entity';
import { PayrollRunEntity } from '../entities/payroll-run.entity';
import { ExpenseEntity, ExpenseStatusEnum } from '../entities/expense.entity';
import { GetRecruitmentStatsService, RecruitmentStats } from './get-recruitment-stats.service';
import { ListInterviewsService } from './list-interviews.service';

export interface HrOverviewReport {
  headcount: {
    total: number;
    byDepartment: Array<{ departmentName: string; count: number }>;
    byEmploymentType: Record<EmploymentTypeEnum, number>;
  };
  newJoinersLast30Days: number;
  attendanceToday: Record<AttendanceStatusEnum | 'NOT_MARKED', number>;
  lateArrivalsToday: Array<{
    employeeId: string;
    fullName: string;
    departmentName: string | null;
    checkInAt: Date | null;
  }>;
  attendanceTrend7Days: Array<{ date: string; present: number; late: number; absent: number }>;
  leave: {
    pendingRequests: number;
    approvedThisMonth: number;
    approvedDaysThisYearByType: Record<LeaveTypeEnum, number>;
  };
  pendingLeaveRequests: Array<{
    id: string;
    employeeName: string;
    leaveType: LeaveTypeEnum;
    startDate: string;
    endDate: string;
    totalDays: number;
  }>;
  payroll: {
    latestRun: { month: number; year: number; status: string; totalNetAmount: string } | null;
    runsThisYear: number;
    trend: Array<{ month: number; year: number; grossAmount: string; netAmount: string; deductions: string }>;
  };
  expenses: {
    pendingCount: number;
    pendingAmount: string;
    approvedNotReimbursedAmount: string;
    reimbursedThisMonthAmount: string;
  };
  recruitment: RecruitmentStats;
  upcomingInterviews: Array<{
    candidateName: string;
    jobTitle: string;
    scheduledAt: Date;
    interviewerNames: string | null;
  }>;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

@Injectable()
export class GetHrOverviewReportService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
    @InjectRepository(LeaveRequestEntity)
    private readonly leaveRequestRepository: Repository<LeaveRequestEntity>,
    @InjectRepository(PayrollRunEntity)
    private readonly payrollRunRepository: Repository<PayrollRunEntity>,
    @InjectRepository(ExpenseEntity)
    private readonly expenseRepository: Repository<ExpenseEntity>,
    private readonly getRecruitmentStatsService: GetRecruitmentStatsService,
    private readonly listInterviewsService: ListInterviewsService,
  ) {}

  async execute(storeId: string): Promise<HrOverviewReport> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

    const [
      activeEmployees,
      newJoinersCount,
      todaysAttendance,
      trendAttendance,
      pendingLeaveCount,
      approvedThisMonthCount,
      approvedThisYear,
      pendingLeaveRequests,
      latestRun,
      runsThisYearCount,
      payrollTrendRuns,
      pendingExpenses,
      approvedExpenses,
      reimbursedExpenses,
      recruitmentStats,
      upcomingInterviews,
    ] = await Promise.all([
      this.employeeRepository.find({
        where: { storeId, employmentStatus: EmploymentStatusEnum.ACTIVE },
        relations: ['department'],
      }),
      this.employeeRepository.count({
        where: { storeId, dateOfJoining: Between(thirtyDaysAgo.toISOString().slice(0, 10), todayIso()) },
      }),
      this.attendanceRepository.find({ where: { storeId, date: todayIso() }, relations: ['employee', 'employee.department'] }),
      this.attendanceRepository.find({
        where: { storeId, date: Between(sevenDaysAgo.toISOString().slice(0, 10), todayIso()) },
      }),
      this.leaveRequestRepository.count({ where: { storeId, status: LeaveStatusEnum.PENDING } }),
      this.leaveRequestRepository.count({
        where: { storeId, status: LeaveStatusEnum.APPROVED, startDate: Between(monthStart.toISOString().slice(0, 10), todayIso()) },
      }),
      this.leaveRequestRepository.find({
        where: { storeId, status: LeaveStatusEnum.APPROVED, startDate: Between(yearStart.toISOString().slice(0, 10), todayIso()) },
      }),
      this.leaveRequestRepository.find({
        where: { storeId, status: LeaveStatusEnum.PENDING },
        relations: ['employee'],
        order: { createdAt: 'ASC' },
        take: 5,
      }),
      this.payrollRunRepository.findOne({ where: { storeId }, order: { year: 'DESC', month: 'DESC' } }),
      this.payrollRunRepository.count({ where: { storeId, year: now.getFullYear() } }),
      this.payrollRunRepository.find({ where: { storeId }, order: { year: 'DESC', month: 'DESC' }, take: 6 }),
      this.expenseRepository.find({ where: { storeId, status: ExpenseStatusEnum.PENDING } }),
      this.expenseRepository.find({ where: { storeId, status: ExpenseStatusEnum.APPROVED } }),
      this.expenseRepository.find({
        where: { storeId, status: ExpenseStatusEnum.REIMBURSED, updatedAt: Between(monthStart, now) },
      }),
      this.getRecruitmentStatsService.execute(storeId),
      this.listInterviewsService.execute(storeId, { upcoming: true, limit: 5 }),
    ]);

    const byDepartment = new Map<string, number>();
    const byEmploymentType: Record<EmploymentTypeEnum, number> = {
      [EmploymentTypeEnum.FULL_TIME]: 0,
      [EmploymentTypeEnum.PART_TIME]: 0,
      [EmploymentTypeEnum.CONTRACT]: 0,
      [EmploymentTypeEnum.INTERN]: 0,
    };
    for (const employee of activeEmployees) {
      const deptName = employee.department?.name ?? 'Unassigned';
      byDepartment.set(deptName, (byDepartment.get(deptName) ?? 0) + 1);
      byEmploymentType[employee.employmentType]++;
    }

    const attendanceToday: Record<AttendanceStatusEnum | 'NOT_MARKED', number> = {
      [AttendanceStatusEnum.PRESENT]: 0,
      [AttendanceStatusEnum.ABSENT]: 0,
      [AttendanceStatusEnum.LATE]: 0,
      [AttendanceStatusEnum.HALF_DAY]: 0,
      [AttendanceStatusEnum.ON_LEAVE]: 0,
      NOT_MARKED: 0,
    };
    for (const record of todaysAttendance) {
      attendanceToday[record.status]++;
    }
    const markedCount = todaysAttendance.length;
    attendanceToday.NOT_MARKED = Math.max(0, activeEmployees.length - markedCount);

    const lateArrivalsToday = todaysAttendance
      .filter((record) => record.status === AttendanceStatusEnum.LATE)
      .map((record) => ({
        employeeId: record.employeeId,
        fullName: record.employee?.fullName ?? 'Unknown',
        departmentName: record.employee?.department?.name ?? null,
        checkInAt: record.checkInAt ?? null,
      }));

    const trendByDate = new Map<string, { present: number; late: number; absent: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      trendByDate.set(d, { present: 0, late: 0, absent: 0 });
    }
    for (const record of trendAttendance) {
      const bucket = trendByDate.get(record.date);
      if (!bucket) continue;
      if (record.status === AttendanceStatusEnum.PRESENT) bucket.present++;
      else if (record.status === AttendanceStatusEnum.LATE) bucket.late++;
      else if (record.status === AttendanceStatusEnum.ABSENT) bucket.absent++;
    }
    const attendanceTrend7Days = Array.from(trendByDate.entries()).map(([date, counts]) => ({ date, ...counts }));

    const approvedDaysThisYearByType: Record<LeaveTypeEnum, number> = {
      [LeaveTypeEnum.EARNED]: 0,
      [LeaveTypeEnum.CASUAL]: 0,
      [LeaveTypeEnum.SICK]: 0,
      [LeaveTypeEnum.UNPAID]: 0,
    };
    for (const request of approvedThisYear) {
      approvedDaysThisYearByType[request.leaveType] += request.totalDays;
    }

    const sum = (items: ExpenseEntity[]) => items.reduce((acc, e) => acc + Number(e.amount), 0).toFixed(2);

    return {
      headcount: {
        total: activeEmployees.length,
        byDepartment: Array.from(byDepartment.entries()).map(([departmentName, count]) => ({ departmentName, count })),
        byEmploymentType,
      },
      newJoinersLast30Days: newJoinersCount,
      attendanceToday,
      lateArrivalsToday,
      attendanceTrend7Days,
      leave: {
        pendingRequests: pendingLeaveCount,
        approvedThisMonth: approvedThisMonthCount,
        approvedDaysThisYearByType,
      },
      pendingLeaveRequests: pendingLeaveRequests.map((r) => ({
        id: r.id,
        employeeName: r.employee?.fullName ?? 'Unknown',
        leaveType: r.leaveType,
        startDate: r.startDate,
        endDate: r.endDate,
        totalDays: r.totalDays,
      })),
      payroll: {
        latestRun: latestRun
          ? { month: latestRun.month, year: latestRun.year, status: latestRun.status, totalNetAmount: latestRun.totalNetAmount }
          : null,
        runsThisYear: runsThisYearCount,
        trend: payrollTrendRuns
          .slice()
          .reverse()
          .map((run) => ({
            month: run.month,
            year: run.year,
            grossAmount: run.totalGrossAmount,
            netAmount: run.totalNetAmount,
            deductions: run.totalDeductions,
          })),
      },
      expenses: {
        pendingCount: pendingExpenses.length,
        pendingAmount: sum(pendingExpenses),
        approvedNotReimbursedAmount: sum(approvedExpenses),
        reimbursedThisMonthAmount: sum(reimbursedExpenses),
      },
      recruitment: recruitmentStats,
      upcomingInterviews: upcomingInterviews.map((interview) => ({
        candidateName: interview.candidate?.fullName ?? 'Unknown',
        jobTitle: interview.candidate?.jobPosting?.title ?? 'Unknown role',
        scheduledAt: interview.scheduledAt,
        interviewerNames: interview.interviewerNames ?? null,
      })),
    };
  }
}
