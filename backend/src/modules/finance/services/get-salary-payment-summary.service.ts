import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PayrollRunEntity, PayrollRunStatusEnum } from '../../hrm/entities/payroll-run.entity';
import { PayslipEntity, SalaryPaymentStatusEnum } from '../../hrm/entities/payslip.entity';
import { QuerySalaryPaymentSummaryDto, SalaryPaymentSummaryResponseDto } from '../dto/salary-payment.dto';

@Injectable()
export class GetSalaryPaymentSummaryService {
  constructor(
    @InjectRepository(PayrollRunEntity)
    private readonly payrollRunRepository: Repository<PayrollRunEntity>,
    @InjectRepository(PayslipEntity)
    private readonly payslipRepository: Repository<PayslipEntity>,
  ) {}

  async execute(storeId: string, query?: QuerySalaryPaymentSummaryDto): Promise<SalaryPaymentSummaryResponseDto> {
    const where: any = {
      storeId,
      status: In([PayrollRunStatusEnum.FINALIZED, PayrollRunStatusEnum.REIMBURSED]),
    };

    if (query?.year) {
      where.year = query.year;
    }
    if (query?.month) {
      where.month = query.month;
    }

    const approvedRuns = await this.payrollRunRepository.find({
      where,
    });

    if (approvedRuns.length === 0) {
      return {
        totalPayrollExpense: 0,
        totalSalaryPayable: 0,
        totalSalaryPaid: 0,
        totalSalaryRemaining: 0,
        totalEmployeesPaid: 0,
        totalEmployeesUnpaid: 0,
        totalApprovedRuns: 0,
        selectedMonth: query?.month,
        selectedYear: query?.year,
      };
    }

    const runIds = approvedRuns.map((r) => r.id);

    const payslips = await this.payslipRepository.find({
      where: {
        storeId,
        payrollRunId: In(runIds),
      },
    });

    let totalPayrollExpense = 0;
    let totalSalaryPayable = 0;
    let totalSalaryPaid = 0;
    let totalEmployeesPaid = 0;
    let totalEmployeesUnpaid = 0;

    for (const run of approvedRuns) {
      totalPayrollExpense += Number(run.totalGrossAmount || 0);
      totalSalaryPayable += Number(run.totalNetAmount || 0);
    }

    for (const slip of payslips) {
      if (slip.paymentStatus === SalaryPaymentStatusEnum.PAID) {
        totalSalaryPaid += Number(slip.paidAmount || slip.netSalary || 0);
        totalEmployeesPaid++;
      } else {
        totalEmployeesUnpaid++;
      }
    }

    const totalSalaryRemaining = Math.max(0, totalSalaryPayable - totalSalaryPaid);

    return {
      totalPayrollExpense: Math.round(totalPayrollExpense * 100) / 100,
      totalSalaryPayable: Math.round(totalSalaryPayable * 100) / 100,
      totalSalaryPaid: Math.round(totalSalaryPaid * 100) / 100,
      totalSalaryRemaining: Math.round(totalSalaryRemaining * 100) / 100,
      totalEmployeesPaid,
      totalEmployeesUnpaid,
      totalApprovedRuns: approvedRuns.length,
      selectedMonth: query?.month,
      selectedYear: query?.year,
    };
  }
}
