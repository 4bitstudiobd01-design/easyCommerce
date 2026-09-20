import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  PayrollPaymentStatusEnum,
  PayrollRunEntity,
  PayrollRunStatusEnum,
} from '../../hrm/entities/payroll-run.entity';
import { PayslipEntity, SalaryPaymentStatusEnum } from '../../hrm/entities/payslip.entity';
import { ListSalaryPaymentRunsQueryDto } from '../dto/salary-payment.dto';

export interface SalaryPaymentRunItem {
  id: string;
  month: number;
  year: number;
  status: PayrollRunStatusEnum;
  paymentStatus: PayrollPaymentStatusEnum;
  totalGrossAmount: string;
  totalDeductions: string;
  totalNetAmount: string;
  totalPaidAmount: string;
  remainingAmount: string;
  totalEmployees: number;
  paidEmployeesCount: number;
  unpaidEmployeesCount: number;
  finalizedAt?: Date;
  approvedByUserId?: string;
  paidAt?: Date;
  createdAt: Date;
}

@Injectable()
export class ListSalaryPaymentRunsService {
  constructor(
    @InjectRepository(PayrollRunEntity)
    private readonly payrollRunRepository: Repository<PayrollRunEntity>,
    @InjectRepository(PayslipEntity)
    private readonly payslipRepository: Repository<PayslipEntity>,
  ) {}

  async execute(storeId: string, query: ListSalaryPaymentRunsQueryDto): Promise<SalaryPaymentRunItem[]> {
    const where: any = {
      storeId,
      status: In([PayrollRunStatusEnum.FINALIZED, PayrollRunStatusEnum.REIMBURSED]),
    };

    if (query.year) {
      where.year = query.year;
    }

    if (query.month) {
      where.month = query.month;
    }

    const runs = await this.payrollRunRepository.find({
      where,
      order: { year: 'DESC', month: 'DESC' },
    });

    if (runs.length === 0) {
      return [];
    }

    const runIds = runs.map((r) => r.id);
    const payslips = await this.payslipRepository.find({
      where: {
        storeId,
        payrollRunId: In(runIds),
      },
    });

    const slipsByRunId = new Map<string, PayslipEntity[]>();
    for (const slip of payslips) {
      const list = slipsByRunId.get(slip.payrollRunId) || [];
      list.push(slip);
      slipsByRunId.set(slip.payrollRunId, list);
    }

    const results: SalaryPaymentRunItem[] = [];

    for (const run of runs) {
      const slips = slipsByRunId.get(run.id) || [];
      const totalEmployees = slips.length;
      let paidCount = 0;
      let totalPaid = 0;

      for (const slip of slips) {
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

      if (query.status && query.status !== 'ALL' && paymentStatus !== query.status) {
        continue;
      }

      results.push({
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
      });
    }

    return results;
  }
}
