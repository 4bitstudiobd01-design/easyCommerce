import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PayrollPaymentStatusEnum,
  PayrollRunEntity,
} from '../../hrm/entities/payroll-run.entity';
import { PayslipEntity, SalaryPaymentStatusEnum } from '../../hrm/entities/payslip.entity';
import { ListSalaryPaymentEmployeesQueryDto } from '../dto/salary-payment.dto';
import { SalaryPaymentRunItem } from './list-salary-payment-runs.service';

export interface SalaryPaymentEmployeeItem {
  payslipId: string;
  employeeId: string;
  employeeCode: string;
  fullName: string;
  email?: string;
  phone?: string;
  departmentId?: string;
  departmentName: string;
  designation?: string;
  basicSalary: string;
  houseRentAllowance: string;
  medicalAllowance: string;
  conveyanceAllowance: string;
  otherAllowance: string;
  grossSalary: string;
  providentFundDeduction: string;
  taxDeduction: string;
  totalDeductions: string;
  netSalary: string;
  paidAmount: string;
  paymentStatus: SalaryPaymentStatusEnum;
  paymentMethod?: string;
  paidAt?: Date;
  paidByUserId?: string;
  paymentReference?: string;
}

export interface SalaryPaymentRunDetailResponse {
  run: SalaryPaymentRunItem;
  employees: SalaryPaymentEmployeeItem[];
}

@Injectable()
export class GetSalaryPaymentRunDetailService {
  constructor(
    @InjectRepository(PayrollRunEntity)
    private readonly payrollRunRepository: Repository<PayrollRunEntity>,
    @InjectRepository(PayslipEntity)
    private readonly payslipRepository: Repository<PayslipEntity>,
  ) {}

  async execute(
    storeId: string,
    runId: string,
    query: ListSalaryPaymentEmployeesQueryDto,
  ): Promise<SalaryPaymentRunDetailResponse> {
    const run = await this.payrollRunRepository.findOne({
      where: { id: runId, storeId },
    });

    if (!run) {
      throw new NotFoundException('Payroll run not found.');
    }

    const allSlips = await this.payslipRepository.find({
      where: { payrollRunId: runId, storeId },
      relations: ['employee', 'employee.department'],
      order: { createdAt: 'ASC' },
    });

    let paidCount = 0;
    let totalPaid = 0;
    const totalEmployees = allSlips.length;

    for (const slip of allSlips) {
      if (slip.paymentStatus === SalaryPaymentStatusEnum.PAID) {
        paidCount++;
        totalPaid += Number(slip.paidAmount || slip.netSalary || 0);
      }
    }

    const totalNet = Number(run.totalNetAmount || 0);
    const remaining = Math.max(0, totalNet - totalPaid);
    const unpaidCount = totalEmployees - paidCount;

    let paymentStatus: PayrollPaymentStatusEnum = PayrollPaymentStatusEnum.UNPAID;
    if (paidCount > 0 && paidCount === totalEmployees && totalEmployees > 0) {
      paymentStatus = PayrollPaymentStatusEnum.PAID;
    } else if (paidCount > 0) {
      paymentStatus = PayrollPaymentStatusEnum.PARTIALLY_PAID;
    }

    const runSummary: SalaryPaymentRunItem = {
      id: run.id,
      month: run.month,
      year: run.year,
      status: run.status,
      paymentStatus,
      totalGrossAmount: Number(run.totalGrossAmount || 0).toFixed(2),
      totalDeductions: Number(run.totalDeductions || 0).toFixed(2),
      totalNetAmount: totalNet.toFixed(2),
      totalPaidAmount: totalPaid.toFixed(2),
      remainingAmount: remaining.toFixed(2),
      totalEmployees,
      paidEmployeesCount: paidCount,
      unpaidEmployeesCount: unpaidCount,
      finalizedAt: run.finalizedAt,
      approvedByUserId: run.approvedByUserId,
      paidAt: run.reimbursedAt,
      createdAt: run.createdAt,
    };

    // Filter employees according to query
    const filteredEmployees: SalaryPaymentEmployeeItem[] = [];

    for (const slip of allSlips) {
      const emp = slip.employee;
      if (!emp) continue;

      if (query.departmentId && emp.departmentId !== query.departmentId) {
        continue;
      }

      if (query.paymentStatus && query.paymentStatus !== 'ALL') {
        if (slip.paymentStatus !== query.paymentStatus) {
          continue;
        }
      }

      if (query.search) {
        const q = query.search.toLowerCase().trim();
        const matchesName = emp.fullName?.toLowerCase().includes(q);
        const matchesCode = emp.employeeCode?.toLowerCase().includes(q);
        const matchesEmail = emp.email?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesEmail) {
          continue;
        }
      }

      const pf = Number(slip.providentFundDeduction || 0);
      const tax = Number(slip.taxDeduction || 0);
      const other = Number(slip.otherDeductions || 0);
      const totalDed = pf + tax + other;

      filteredEmployees.push({
        payslipId: slip.id,
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        email: emp.email,
        phone: emp.phone,
        departmentId: emp.departmentId,
        departmentName: emp.department?.name || 'Unassigned',
        designation: emp.designation,
        basicSalary: Number(slip.basicSalary || 0).toFixed(2),
        houseRentAllowance: Number(slip.houseRentAllowance || 0).toFixed(2),
        medicalAllowance: Number(slip.medicalAllowance || 0).toFixed(2),
        conveyanceAllowance: Number(slip.conveyanceAllowance || 0).toFixed(2),
        otherAllowance: Number(slip.otherAllowance || 0).toFixed(2),
        grossSalary: Number(slip.grossSalary || 0).toFixed(2),
        providentFundDeduction: pf.toFixed(2),
        taxDeduction: tax.toFixed(2),
        totalDeductions: totalDed.toFixed(2),
        netSalary: Number(slip.netSalary || 0).toFixed(2),
        paidAmount: Number(slip.paidAmount || (slip.paymentStatus === SalaryPaymentStatusEnum.PAID ? slip.netSalary : 0)).toFixed(2),
        paymentStatus: slip.paymentStatus || SalaryPaymentStatusEnum.UNPAID,
        paymentMethod: slip.paymentMethod || 'CASH',
        paidAt: slip.paidAt,
        paidByUserId: slip.paidByUserId,
        paymentReference: slip.paymentReference,
      });
    }

    return {
      run: runSummary,
      employees: filteredEmployees,
    };
  }
}
