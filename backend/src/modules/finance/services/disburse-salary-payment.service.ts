import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  PayrollPaymentStatusEnum,
  PayrollRunEntity,
  PayrollRunStatusEnum,
} from '../../hrm/entities/payroll-run.entity';
import {
  PayslipEntity,
  SalaryPaymentMethodEnum,
  SalaryPaymentStatusEnum,
} from '../../hrm/entities/payslip.entity';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { FinanceCategoryEntity } from '../entities/finance-category.entity';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { UserEntity, UserRoleEnum } from '../../user/entities/user.entity';
import { StaffMemberEntity } from '../../staff/entities/staff.entity';
import {
  FinanceCategoryTypeEnum,
  FinanceSourceTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceTransactionTypeEnum,
} from '../enums/finance.enums';
import { BulkDisburseSalaryPaymentDto, DisburseSalaryPaymentDto } from '../dto/salary-payment.dto';

export interface DisburseSalaryPaymentResult {
  success: boolean;
  message: string;
  disbursedCount: number;
  totalDisbursedAmount: number;
  payrollRunId: string;
  payrollPaymentStatus: PayrollPaymentStatusEnum;
}

@Injectable()
export class DisburseSalaryPaymentService {
  private readonly logger = new Logger(DisburseSalaryPaymentService.name);

  constructor(
    @InjectRepository(PayrollRunEntity)
    private readonly payrollRunRepository: Repository<PayrollRunEntity>,
    @InjectRepository(PayslipEntity)
    private readonly payslipRepository: Repository<PayslipEntity>,
    @InjectRepository(FinanceAccountEntity)
    private readonly accountRepository: Repository<FinanceAccountEntity>,
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
    @InjectRepository(FinanceCategoryEntity)
    private readonly categoryRepository: Repository<FinanceCategoryEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(StaffMemberEntity)
    private readonly staffRepository: Repository<StaffMemberEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Helper to verify that only an Administrator or Store Owner can disburse/edit
   * salaries for a previous/past month.
   */
  private async verifyAdminForPreviousMonth(
    userId: string,
    storeId: string,
    runMonth: number,
    runYear: number,
  ): Promise<void> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const isPastMonth =
      runYear < currentYear || (runYear === currentYear && runMonth < currentMonth);

    if (isPastMonth) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      const isOwnerOrSuper =
        user?.role === UserRoleEnum.SUPER_ADMIN || user?.role === UserRoleEnum.STORE_OWNER;

      if (!isOwnerOrSuper) {
        const staff = await this.staffRepository.findOne({
          where: { userId, storeId },
        });
        const roleName = (staff?.role || '').toUpperCase();
        const isStaffAdmin =
          roleName === 'ADMIN' ||
          roleName === 'STORE_ADMIN' ||
          roleName === 'STORE_MANAGER' ||
          roleName === 'SUPER_ADMIN';

        if (!isStaffAdmin) {
          throw new ForbiddenException(
            `Previous month (${runMonth}/${runYear}) salary is locked. Only an Administrator can edit or disburse past months salary.`,
          );
        }
      }
    }
  }

  /**
   * Disburses payment for a single employee payslip.
   */
  async disburseSingle(
    tenantId: string,
    storeId: string,
    userId: string,
    dto: DisburseSalaryPaymentDto,
  ): Promise<DisburseSalaryPaymentResult> {
    const payslip = await this.payslipRepository.findOne({
      where: { id: dto.payslipId, storeId },
      relations: ['payrollRun', 'employee'],
    });

    if (!payslip) {
      throw new NotFoundException('Payslip not found.');
    }

    if (!payslip.payrollRun) {
      throw new NotFoundException('Associated payroll run not found.');
    }

    if (payslip.payrollRun.status === PayrollRunStatusEnum.DRAFT) {
      throw new BadRequestException(
        'Cannot disburse payment for a draft payroll. Please approve the payroll run first.',
      );
    }

    if (payslip.paymentStatus === SalaryPaymentStatusEnum.PAID) {
      throw new BadRequestException('This employee salary has already been marked as paid.');
    }

    // Enforce Admin check if this is a previous month
    await this.verifyAdminForPreviousMonth(
      userId,
      storeId,
      payslip.payrollRun.month,
      payslip.payrollRun.year,
    );

    return this.executeDisbursement(
      tenantId,
      storeId,
      userId,
      payslip.payrollRunId,
      [payslip],
      dto.paymentMethod || SalaryPaymentMethodEnum.CASH,
      dto.accountId,
      dto.paymentDate,
      dto.paymentReference,
    );
  }

  /**
   * Bulk disburses cash/payment for multiple or all unpaid payslips in a payroll run.
   */
  async disburseBulk(
    tenantId: string,
    storeId: string,
    userId: string,
    dto: BulkDisburseSalaryPaymentDto,
  ): Promise<DisburseSalaryPaymentResult> {
    const run = await this.payrollRunRepository.findOne({
      where: { id: dto.payrollRunId, storeId },
    });

    if (!run) {
      throw new NotFoundException('Payroll run not found.');
    }

    if (run.status === PayrollRunStatusEnum.DRAFT) {
      throw new BadRequestException(
        'Cannot disburse payment for a draft payroll. Please approve the payroll run first.',
      );
    }

    // Enforce Admin check if this is a previous month
    await this.verifyAdminForPreviousMonth(userId, storeId, run.month, run.year);

    let whereSlips: any = {
      payrollRunId: dto.payrollRunId,
      storeId,
      paymentStatus: SalaryPaymentStatusEnum.UNPAID,
    };

    if (dto.payslipIds && dto.payslipIds.length > 0) {
      whereSlips.id = In(dto.payslipIds);
    }

    const unpaidSlips = await this.payslipRepository.find({
      where: whereSlips,
      relations: ['employee'],
    });

    if (unpaidSlips.length === 0) {
      throw new BadRequestException('No unpaid payslips found in this payroll batch.');
    }

    return this.executeDisbursement(
      tenantId,
      storeId,
      userId,
      run.id,
      unpaidSlips,
      dto.paymentMethod || SalaryPaymentMethodEnum.CASH,
      dto.accountId,
      dto.paymentDate,
      dto.paymentReference,
    );
  }

  /**
   * Internal transactional execution of single or bulk salary payments.
   */
  private async executeDisbursement(
    tenantId: string,
    storeId: string,
    userId: string,
    payrollRunId: string,
    payslips: PayslipEntity[],
    paymentMethod: SalaryPaymentMethodEnum,
    accountId?: string,
    paymentDateStr?: string,
    paymentReference?: string,
  ): Promise<DisburseSalaryPaymentResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Resolve payout finance account (Cash by default)
      let financeAccount: FinanceAccountEntity | null = null;
      if (accountId) {
        financeAccount = await queryRunner.manager.findOne(FinanceAccountEntity, {
          where: { id: accountId, storeId },
        });
      }

      if (!financeAccount) {
        financeAccount = await queryRunner.manager.findOne(FinanceAccountEntity, {
          where: { storeId, isDefault: true },
        });
      }

      if (!financeAccount) {
        financeAccount = await queryRunner.manager.findOne(FinanceAccountEntity, {
          where: { storeId },
        });
      }

      // 2. Resolve Salary Category for transaction
      let salaryCategory = await queryRunner.manager.findOne(FinanceCategoryEntity, {
        where: { storeId, code: 'SALARY' },
      });

      if (!salaryCategory) {
        salaryCategory = queryRunner.manager.create(FinanceCategoryEntity, {
          tenantId,
          storeId,
          name: 'Salaries & Payroll',
          code: 'SALARY',
          type: FinanceCategoryTypeEnum.EXPENSE,
          color: '#ec4899',
          isSystem: true,
        });
        salaryCategory = await queryRunner.manager.save(salaryCategory);
      }

      const paymentDate = paymentDateStr || new Date().toISOString().split('T')[0];
      const timestampNow = new Date();
      let totalDisbursedAmount = 0;
      const payslipIds = payslips.map((p) => p.id);

      // Generate base transaction number
      const count = await queryRunner.manager.count(FinanceTransactionEntity, {
        where: { storeId },
      });
      const txnSeq = count + 1;

      // 3. Mark each payslip as PAID and record transaction
      for (let i = 0; i < payslips.length; i++) {
        const slip = payslips[i];
        const netAmt = Number(slip.netSalary || 0);
        totalDisbursedAmount += netAmt;

        const employeeName = slip.employee ? slip.employee.fullName : 'Staff';
        const employeeCode = slip.employee?.employeeCode || 'EMP';
        const customRef = paymentReference || `CASH-SALARY-${employeeCode}-${Date.now().toString().slice(-4)}`;

        // Create Finance Expense Transaction (Credit Cash, Debit Salaries Expense)
        const txn = queryRunner.manager.create(FinanceTransactionEntity, {
          tenantId,
          storeId,
          transactionNumber: `TXN-SAL-${String(txnSeq + i).padStart(6, '0')}`,
          type: FinanceTransactionTypeEnum.EXPENSE,
          amount: netAmt.toFixed(2),
          currency: 'BDT',
          transactionDate: paymentDate,
          accountId: financeAccount ? financeAccount.id : undefined,
          categoryId: salaryCategory ? salaryCategory.id : undefined,
          categoryCode: 'SALARY',
          description: `Cash salary disbursement to ${employeeName} (${employeeCode})`,
          reference: customRef,
          sourceType: FinanceSourceTypeEnum.PAYROLL,
          sourceId: slip.id,
          paymentMethod: paymentMethod === SalaryPaymentMethodEnum.CASH ? 'CASH' : 'BANK_TRANSFER',
          status: FinanceTransactionStatusEnum.COMPLETED,
        });

        const savedTxn = await queryRunner.manager.save(txn);

        // Update Payslip
        slip.paymentStatus = SalaryPaymentStatusEnum.PAID;
        slip.paymentMethod = paymentMethod;
        slip.paidAmount = netAmt.toFixed(2);
        slip.paidAt = timestampNow;
        slip.paidByUserId = userId;
        slip.paymentReference = customRef;
        slip.financeTransactionId = savedTxn.id;
        slip.financeAccountId = financeAccount?.id;

        await queryRunner.manager.save(slip);
      }

      // 4. Deduct amount from Finance Account balance
      if (financeAccount) {
        const currentBal = Number(financeAccount.currentBalance || 0);
        const newBal = currentBal - totalDisbursedAmount;
        financeAccount.currentBalance = newBal.toFixed(2);
        await queryRunner.manager.save(financeAccount);
      }

      // 5. Recalculate Payroll Run Totals and Payment Status
      const run = await queryRunner.manager.findOne(PayrollRunEntity, {
        where: { id: payrollRunId, storeId },
      });

      if (run) {
        const allSlipsInRun = await queryRunner.manager.find(PayslipEntity, {
          where: { payrollRunId: run.id, storeId },
        });

        let totalPaidSum = 0;
        let paidCount = 0;
        for (const s of allSlipsInRun) {
          if (s.paymentStatus === SalaryPaymentStatusEnum.PAID) {
            paidCount++;
            totalPaidSum += Number(s.paidAmount || s.netSalary || 0);
          }
        }

        run.totalPaidAmount = totalPaidSum.toFixed(2);
        run.paidEmployeeCount = paidCount;

        if (paidCount === allSlipsInRun.length && allSlipsInRun.length > 0) {
          run.paymentStatus = PayrollPaymentStatusEnum.PAID;
          run.paidAt = timestampNow;
        } else if (paidCount > 0) {
          run.paymentStatus = PayrollPaymentStatusEnum.PARTIALLY_PAID;
        } else {
          run.paymentStatus = PayrollPaymentStatusEnum.UNPAID;
        }

        await queryRunner.manager.save(run);
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Disbursed ${payslips.length} salary payments (Total ৳${totalDisbursedAmount}) for run ${payrollRunId}.`,
      );

      return {
        success: true,
        message: `Successfully disbursed cash salary to ${payslips.length} employee(s).`,
        disbursedCount: payslips.length,
        totalDisbursedAmount: Math.round(totalDisbursedAmount * 100) / 100,
        payrollRunId,
        payrollPaymentStatus: run ? run.paymentStatus : PayrollPaymentStatusEnum.PAID,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to disburse salary payment: ${(err as any).message}`, (err as any).stack);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
