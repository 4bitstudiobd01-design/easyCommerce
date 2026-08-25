import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { EmployeeEntity, EmploymentStatusEnum, EmploymentTypeEnum } from '../entities/employee.entity';
import { AttendanceEntity, AttendanceStatusEnum } from '../entities/attendance.entity';
import { LeaveRequestEntity, LeaveStatusEnum, LeaveTypeEnum } from '../entities/leave-request.entity';
import { PayrollRunEntity } from '../entities/payroll-run.entity';
import { ExpenseEntity, ExpenseStatusEnum } from '../entities/expense.entity';

export interface HrOverviewReport {
  headcount: {
    total: number;
    byDepartment: Array<{ departmentName: string; count: number }>;
    byEmploymentType: Record<EmploymentTypeEnum, number>;
  };
  attendanceToday: Record<AttendanceStatusEnum | 'NOT_MARKED', number>;
  leave: {
    pendingRequests: number;
    approvedThisMonth: number;
    approvedDaysThisYearByType: Record<LeaveTypeEnum, number>;
  };
  payroll: {
    latestRun: { month: number; year: number; status: string; totalNetAmount: string } | null;
    runsThisYear: number;
  };
  expenses: {
    pendingCount: number;
    pendingAmount: string;
    approvedNotReimbursedAmount: string;
    reimbursedThisMonthAmount: string;
  };
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
  ) {}

  async execute(storeId: string): Promise<HrOverviewReport> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [
      activeEmployees,
      todaysAttendance,
      pendingLeaveCount,
      approvedThisMonthCount,
      approvedThisYear,
      latestRun,
      runsThisYearCount,
      pendingExpenses,
      approvedExpenses,
      reimbursedExpenses,
    ] = await Promise.all([
      this.employeeRepository.find({
        where: { storeId, employmentStatus: EmploymentStatusEnum.ACTIVE },
        relations: ['department'],
      }),
      this.attendanceRepository.find({ where: { storeId, date: todayIso() } }),
      this.leaveRequestRepository.count({ where: { storeId, status: LeaveStatusEnum.PENDING } }),
      this.leaveRequestRepository.count({
        where: { storeId, status: LeaveStatusEnum.APPROVED, startDate: Between(monthStart.toISOString().slice(0, 10), todayIso()) },
      }),
      this.leaveRequestRepository.find({
        where: { storeId, status: LeaveStatusEnum.APPROVED, startDate: Between(yearStart.toISOString().slice(0, 10), todayIso()) },
      }),
      this.payrollRunRepository.findOne({ where: { storeId }, order: { year: 'DESC', month: 'DESC' } }),
      this.payrollRunRepository.count({ where: { storeId, year: now.getFullYear() } }),
      this.expenseRepository.find({ where: { storeId, status: ExpenseStatusEnum.PENDING } }),
      this.expenseRepository.find({ where: { storeId, status: ExpenseStatusEnum.APPROVED } }),
      this.expenseRepository.find({
        where: { storeId, status: ExpenseStatusEnum.REIMBURSED, updatedAt: Between(monthStart, now) },
      }),
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

    const approvedDaysThisYearByType: Record<LeaveTypeEnum, number> = {
      [LeaveTypeEnum.EARNED]: 0,
      [LeaveTypeEnum.CASUAL]: 0,
      [LeaveTypeEnum.SICK]: 0,
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
      attendanceToday,
      leave: {
        pendingRequests: pendingLeaveCount,
        approvedThisMonth: approvedThisMonthCount,
        approvedDaysThisYearByType,
      },
      payroll: {
        latestRun: latestRun
          ? { month: latestRun.month, year: latestRun.year, status: latestRun.status, totalNetAmount: latestRun.totalNetAmount }
          : null,
        runsThisYear: runsThisYearCount,
      },
      expenses: {
        pendingCount: pendingExpenses.length,
        pendingAmount: sum(pendingExpenses),
        approvedNotReimbursedAmount: sum(approvedExpenses),
        reimbursedThisMonthAmount: sum(reimbursedExpenses),
      },
    };
  }
}
