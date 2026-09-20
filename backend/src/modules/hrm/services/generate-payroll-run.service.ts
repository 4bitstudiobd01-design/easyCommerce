import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollRunEntity, PayrollRunStatusEnum } from '../entities/payroll-run.entity';
import { PayslipEntity } from '../entities/payslip.entity';
import { EmployeeEntity, EmploymentStatusEnum } from '../entities/employee.entity';
import { SalaryStructureEntity } from '../entities/salary-structure.entity';
import { TaxSlabEntity } from '../entities/tax-slab.entity';
import { ComputeTaxService } from './compute-tax.service';
import { ComputeAttendanceDeductionService } from './compute-attendance-deduction.service';
import { GeneratePayrollRunDto } from '../dto/payroll.dto';

@Injectable()
export class GeneratePayrollRunService {
  constructor(
    @InjectRepository(PayrollRunEntity)
    private readonly payrollRunRepository: Repository<PayrollRunEntity>,
    @InjectRepository(PayslipEntity)
    private readonly payslipRepository: Repository<PayslipEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(SalaryStructureEntity)
    private readonly salaryStructureRepository: Repository<SalaryStructureEntity>,
    @InjectRepository(TaxSlabEntity)
    private readonly taxSlabRepository: Repository<TaxSlabEntity>,
    private readonly computeTaxService: ComputeTaxService,
    private readonly computeAttendanceDeductionService: ComputeAttendanceDeductionService,
  ) {}

  /**
   * Generates one payslip per active employee that has a salary structure. Employees
   * without one are skipped (counted, not silently dropped) — HR sets up pay structures
   * from the Salary Structures tab before running payroll for a new hire.
   *
   * Tax is computed from the store's own configured tax slabs (Settings > Tax) for the
   * run's fiscal year, if any are set — this module never assumes or hardcodes a rate.
   * If no slabs are configured, tax stays 0, matching the pre-tax-module behavior.
   *
   * Deductions also include an attendance/leave-based amount from that month's LATE
   * arrivals (every N = 1 deducted day, per the store's ComputeAttendanceDeductionService
   * policy), approved UNPAID leave days, and unmarked ABSENT days — snapshotted onto the
   * payslip at generation time and never silently recomputed afterward.
   */
  async execute(tenantId: string, storeId: string, createdByUserId: string, dto: GeneratePayrollRunDto): Promise<PayrollRunEntity> {
    const existing = await this.payrollRunRepository.findOne({ where: { storeId, month: dto.month, year: dto.year } });
    if (existing) {
      throw new ConflictException(`A payroll run for ${dto.month}/${dto.year} already exists.`);
    }

    const fiscalYear = this.computeTaxService.getFiscalYear(dto.month, dto.year);
    const [employees, structures, taxSlabs] = await Promise.all([
      this.employeeRepository.find({ where: { storeId, employmentStatus: EmploymentStatusEnum.ACTIVE } }),
      this.salaryStructureRepository.find({ where: { storeId } }),
      this.taxSlabRepository.find({ where: { storeId, fiscalYear }, order: { sortOrder: 'ASC' } }),
    ]);
    const structureByEmployeeId = new Map(structures.map((s) => [s.employeeId, s]));

    const run = await this.payrollRunRepository.save(
      this.payrollRunRepository.create({
        tenantId,
        storeId,
        month: dto.month,
        year: dto.year,
        status: PayrollRunStatusEnum.REVIEW,
        createdByUserId,
      }),
    );

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let skippedCount = 0;

    for (const employee of employees) {
      const structure = structureByEmployeeId.get(employee.id);
      if (!structure) {
        skippedCount++;
        continue;
      }

      const basic = Number(structure.basicSalary);
      const hra = Number(structure.houseRentAllowance);
      const medical = Number(structure.medicalAllowance);
      const conveyance = Number(structure.conveyanceAllowance);
      const other = Number(structure.otherAllowance);
      const providentFund = Number(structure.providentFundDeduction);

      const gross = basic + hra + medical + conveyance + other;
      const monthlyTax = taxSlabs.length > 0 ? this.computeTaxService.computeAnnualTax(taxSlabs, gross * 12).monthlyTax : 0;
      const attendanceDeduction = await this.computeAttendanceDeductionService.execute(
        tenantId,
        storeId,
        employee.id,
        dto.month,
        dto.year,
        gross,
      );
      const deductions = providentFund + monthlyTax + attendanceDeduction.amount;
      const net = gross - deductions;

      await this.payslipRepository.save(
        this.payslipRepository.create({
          tenantId,
          storeId,
          payrollRunId: run.id,
          employeeId: employee.id,
          basicSalary: basic.toFixed(2),
          houseRentAllowance: hra.toFixed(2),
          medicalAllowance: medical.toFixed(2),
          conveyanceAllowance: conveyance.toFixed(2),
          otherAllowance: other.toFixed(2),
          grossSalary: gross.toFixed(2),
          providentFundDeduction: providentFund.toFixed(2),
          taxDeduction: monthlyTax.toFixed(2),
          otherDeductions: '0.00',
          attendanceDeduction: attendanceDeduction.amount.toFixed(2),
          attendanceDeductionDays: attendanceDeduction.totalDeductionDays.toFixed(2),
          attendanceDeductionBreakdown: attendanceDeduction,
          netSalary: net.toFixed(2),
        }),
      );

      totalGross += gross;
      totalDeductions += deductions;
      totalNet += net;
    }

    run.totalGrossAmount = totalGross.toFixed(2);
    run.totalDeductions = totalDeductions.toFixed(2);
    run.totalNetAmount = totalNet.toFixed(2);
    run.skippedEmployeeCount = skippedCount;

    return this.payrollRunRepository.save(run);
  }
}
