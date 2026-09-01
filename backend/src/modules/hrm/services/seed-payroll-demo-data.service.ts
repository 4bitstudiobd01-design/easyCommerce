import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DepartmentEntity } from '../entities/department.entity';
import {
  EmployeeEntity,
  EmployeeGenderEnum,
  EmploymentStatusEnum,
  EmploymentTypeEnum,
} from '../entities/employee.entity';
import { SalaryStructureEntity } from '../entities/salary-structure.entity';
import { TaxSlabEntity } from '../entities/tax-slab.entity';
import {
  PayrollPaymentStatusEnum,
  PayrollRunEntity,
  PayrollRunStatusEnum,
} from '../entities/payroll-run.entity';
import {
  PayslipEntity,
  SalaryPaymentMethodEnum,
  SalaryPaymentStatusEnum,
} from '../entities/payslip.entity';
import { ComputeTaxService } from './compute-tax.service';
import { SeedPayrollDemoDataResponseDto } from '../dto/seed-payroll-demo-data-response.dto';

interface DemoEmployeeDef {
  code: string;
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  departmentName: string;
  employmentType: EmploymentTypeEnum;
  gender: EmployeeGenderEnum;
  dateOfJoining: string;
  basicSalary: number;
  houseRentAllowance: number;
  medicalAllowance: number;
  conveyanceAllowance: number;
  otherAllowance: number;
  providentFundDeduction: number;
}

const DEMO_DEPARTMENTS = [
  { name: 'Engineering', description: 'Software engineering, DevOps, and Product design' },
  { name: 'Marketing & Growth', description: 'Brand marketing, social media campaigns, and user acquisition' },
  { name: 'Human Resources', description: 'People operations, talent acquisition, and employee engagement' },
  { name: 'Customer Support', description: '24/7 customer care, query resolution, and post-sales support' },
  { name: 'Operations & Logistics', description: 'Supply chain management, fulfillment, and warehouse logistics' },
  { name: 'Finance & Accounts', description: 'Financial planning, tax compliance, and payroll accounting' },
];

const DEMO_EMPLOYEES: DemoEmployeeDef[] = [
  {
    code: 'EMP-1001',
    fullName: 'Tariqul Islam',
    email: 'tariqul.islam@example.com',
    phone: '+8801712000001',
    designation: 'Lead Software Engineer',
    departmentName: 'Engineering',
    employmentType: EmploymentTypeEnum.FULL_TIME,
    gender: EmployeeGenderEnum.MALE,
    dateOfJoining: '2024-01-15',
    basicSalary: 55000,
    houseRentAllowance: 22000,
    medicalAllowance: 8000,
    conveyanceAllowance: 6000,
    otherAllowance: 4000,
    providentFundDeduction: 4500,
  },
  {
    code: 'EMP-1002',
    fullName: 'Nusrat Jahan',
    email: 'nusrat.jahan@example.com',
    phone: '+8801712000002',
    designation: 'Senior UI/UX Designer',
    departmentName: 'Engineering',
    employmentType: EmploymentTypeEnum.FULL_TIME,
    gender: EmployeeGenderEnum.FEMALE,
    dateOfJoining: '2024-03-01',
    basicSalary: 42000,
    houseRentAllowance: 18000,
    medicalAllowance: 6000,
    conveyanceAllowance: 5000,
    otherAllowance: 4000,
    providentFundDeduction: 3500,
  },
  {
    code: 'EMP-1003',
    fullName: 'Shakil Ahmed',
    email: 'shakil.ahmed@example.com',
    phone: '+8801712000003',
    designation: 'Growth Marketing Manager',
    departmentName: 'Marketing & Growth',
    employmentType: EmploymentTypeEnum.FULL_TIME,
    gender: EmployeeGenderEnum.MALE,
    dateOfJoining: '2024-02-10',
    basicSalary: 36000,
    houseRentAllowance: 16000,
    medicalAllowance: 5000,
    conveyanceAllowance: 5000,
    otherAllowance: 3000,
    providentFundDeduction: 3000,
  },
  {
    code: 'EMP-1004',
    fullName: 'Farhana Akter',
    email: 'farhana.akter@example.com',
    phone: '+8801712000004',
    designation: 'HR Operations Lead',
    departmentName: 'Human Resources',
    employmentType: EmploymentTypeEnum.FULL_TIME,
    gender: EmployeeGenderEnum.FEMALE,
    dateOfJoining: '2024-01-01',
    basicSalary: 32000,
    houseRentAllowance: 14000,
    medicalAllowance: 5000,
    conveyanceAllowance: 4000,
    otherAllowance: 3000,
    providentFundDeduction: 2800,
  },
  {
    code: 'EMP-1005',
    fullName: 'Mehedi Hasan',
    email: 'mehedi.hasan@example.com',
    phone: '+8801712000005',
    designation: 'Senior Backend Engineer',
    departmentName: 'Engineering',
    employmentType: EmploymentTypeEnum.FULL_TIME,
    gender: EmployeeGenderEnum.MALE,
    dateOfJoining: '2024-04-15',
    basicSalary: 48000,
    houseRentAllowance: 20000,
    medicalAllowance: 7000,
    conveyanceAllowance: 6000,
    otherAllowance: 4000,
    providentFundDeduction: 4000,
  },
  {
    code: 'EMP-1006',
    fullName: 'Sumaiya Rahman',
    email: 'sumaiya.rahman@example.com',
    phone: '+8801712000006',
    designation: 'Customer Support Lead',
    departmentName: 'Customer Support',
    employmentType: EmploymentTypeEnum.FULL_TIME,
    gender: EmployeeGenderEnum.FEMALE,
    dateOfJoining: '2024-05-01',
    basicSalary: 24000,
    houseRentAllowance: 10000,
    medicalAllowance: 3500,
    conveyanceAllowance: 3000,
    otherAllowance: 1500,
    providentFundDeduction: 2000,
  },
  {
    code: 'EMP-1007',
    fullName: 'Tanvir Hossain',
    email: 'tanvir.hossain@example.com',
    phone: '+8801712000007',
    designation: 'Logistics Coordinator',
    departmentName: 'Operations & Logistics',
    employmentType: EmploymentTypeEnum.FULL_TIME,
    gender: EmployeeGenderEnum.MALE,
    dateOfJoining: '2024-06-01',
    basicSalary: 28000,
    houseRentAllowance: 11000,
    medicalAllowance: 4000,
    conveyanceAllowance: 3000,
    otherAllowance: 2000,
    providentFundDeduction: 2200,
  },
  {
    code: 'EMP-1008',
    fullName: 'Afsana Mimi',
    email: 'afsana.mimi@example.com',
    phone: '+8801712000008',
    designation: 'Senior Financial Analyst',
    departmentName: 'Finance & Accounts',
    employmentType: EmploymentTypeEnum.FULL_TIME,
    gender: EmployeeGenderEnum.FEMALE,
    dateOfJoining: '2024-02-01',
    basicSalary: 40000,
    houseRentAllowance: 17000,
    medicalAllowance: 5500,
    conveyanceAllowance: 4500,
    otherAllowance: 3000,
    providentFundDeduction: 3200,
  },
];

const DEMO_TAX_SLABS = [
  { minAmount: '0.00', maxAmount: '350000.00', ratePercent: '0.00', sortOrder: 1 },
  { minAmount: '350000.00', maxAmount: '450000.00', ratePercent: '5.00', sortOrder: 2 },
  { minAmount: '450000.00', maxAmount: '750000.00', ratePercent: '10.00', sortOrder: 3 },
  { minAmount: '750000.00', maxAmount: '1150000.00', ratePercent: '15.00', sortOrder: 4 },
  { minAmount: '1150000.00', maxAmount: '1650000.00', ratePercent: '20.00', sortOrder: 5 },
  { minAmount: '1650000.00', maxAmount: undefined, ratePercent: '25.00', sortOrder: 6 },
];

const DEMO_RUNS = [
  {
    month: 6,
    year: 2026,
    status: PayrollRunStatusEnum.PAID,
    paymentStatus: PayrollPaymentStatusEnum.PAID,
    finalizedAt: new Date('2026-06-30T16:00:00.000Z'),
    paidAt: new Date('2026-07-02T10:30:00.000Z'),
    paidEmployeesFraction: 1, // all paid
  },
  {
    month: 7,
    year: 2026,
    status: PayrollRunStatusEnum.PAID,
    paymentStatus: PayrollPaymentStatusEnum.PAID,
    finalizedAt: new Date('2026-07-31T16:00:00.000Z'),
    paidAt: new Date('2026-08-02T11:15:00.000Z'),
    paidEmployeesFraction: 1, // all paid
  },
  {
    month: 8,
    year: 2026,
    status: PayrollRunStatusEnum.FINALIZED,
    paymentStatus: PayrollPaymentStatusEnum.PARTIALLY_PAID,
    finalizedAt: new Date('2026-08-31T17:00:00.000Z'),
    paidAt: undefined,
    paidEmployeesFraction: 0.625, // 5 of 8 paid
  },
  {
    month: 9,
    year: 2026,
    status: PayrollRunStatusEnum.DRAFT,
    paymentStatus: PayrollPaymentStatusEnum.UNPAID,
    finalizedAt: undefined,
    paidAt: undefined,
    paidEmployeesFraction: 0, // none paid
  },
];

@Injectable()
export class SeedPayrollDemoDataService {
  private readonly logger = new Logger(SeedPayrollDemoDataService.name);

  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(SalaryStructureEntity)
    private readonly salaryStructureRepository: Repository<SalaryStructureEntity>,
    @InjectRepository(TaxSlabEntity)
    private readonly taxSlabRepository: Repository<TaxSlabEntity>,
    @InjectRepository(PayrollRunEntity)
    private readonly payrollRunRepository: Repository<PayrollRunEntity>,
    @InjectRepository(PayslipEntity)
    private readonly payslipRepository: Repository<PayslipEntity>,
    private readonly computeTaxService: ComputeTaxService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    userId?: string,
  ): Promise<SeedPayrollDemoDataResponseDto> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Demo payroll seeder is strictly disabled in production environments.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let departmentsCreated = 0;
    let employeesCreated = 0;
    let taxSlabsCreated = 0;
    let salaryStructuresCreated = 0;
    let payrollRunsCreated = 0;
    let payslipsCreated = 0;

    try {
      // 1. Seed or retrieve Departments
      const existingDepartments = await queryRunner.manager.find(DepartmentEntity, { where: { storeId } });
      const departmentMap = new Map<string, DepartmentEntity>(
        existingDepartments.map((d) => [d.name.toLowerCase().trim(), d]),
      );

      for (const deptDef of DEMO_DEPARTMENTS) {
        const key = deptDef.name.toLowerCase().trim();
        if (!departmentMap.has(key)) {
          const dept = queryRunner.manager.create(DepartmentEntity, {
            tenantId,
            storeId,
            name: deptDef.name,
            description: deptDef.description,
            isActive: true,
          });
          const saved = await queryRunner.manager.save(dept);
          departmentMap.set(key, saved);
          departmentsCreated++;
        }
      }

      // 2. Seed Tax Slabs for 2025-2026 & 2026-2027
      const fiscalYears = ['2025-2026', '2026-2027'];
      for (const fy of fiscalYears) {
        const existingSlabs = await queryRunner.manager.find(TaxSlabEntity, {
          where: { storeId, fiscalYear: fy },
        });
        if (existingSlabs.length === 0) {
          for (const slabDef of DEMO_TAX_SLABS) {
            const slab = queryRunner.manager.create(TaxSlabEntity, {
              tenantId,
              storeId,
              fiscalYear: fy,
              minAmount: slabDef.minAmount,
              maxAmount: slabDef.maxAmount,
              ratePercent: slabDef.ratePercent,
              sortOrder: slabDef.sortOrder,
            });
            await queryRunner.manager.save(slab);
            taxSlabsCreated++;
          }
        }
      }

      // 3. Seed or retrieve Employees
      const existingEmployees = await queryRunner.manager.find(EmployeeEntity, { where: { storeId } });
      const employeeMap = new Map<string, EmployeeEntity>(
        existingEmployees.map((e) => [e.employeeCode, e]),
      );

      const activeEmployeesForPayroll: EmployeeEntity[] = [];

      for (const empDef of DEMO_EMPLOYEES) {
        let emp = employeeMap.get(empDef.code);
        if (!emp) {
          const dept = departmentMap.get(empDef.departmentName.toLowerCase().trim());
          emp = queryRunner.manager.create(EmployeeEntity, {
            tenantId,
            storeId,
            employeeCode: empDef.code,
            fullName: empDef.fullName,
            email: empDef.email,
            phone: empDef.phone,
            designation: empDef.designation,
            departmentId: dept?.id,
            employmentType: empDef.employmentType,
            employmentStatus: EmploymentStatusEnum.ACTIVE,
            gender: empDef.gender,
            dateOfJoining: empDef.dateOfJoining,
          });
          emp = await queryRunner.manager.save(emp);
          employeeMap.set(empDef.code, emp);
          employeesCreated++;
        }
        activeEmployeesForPayroll.push(emp);

        // 4. Seed or update Salary Structure
        let structure = await queryRunner.manager.findOne(SalaryStructureEntity, {
          where: { storeId, employeeId: emp.id },
        });
        if (!structure) {
          structure = queryRunner.manager.create(SalaryStructureEntity, {
            tenantId,
            storeId,
            employeeId: emp.id,
            basicSalary: empDef.basicSalary.toFixed(2),
            houseRentAllowance: empDef.houseRentAllowance.toFixed(2),
            medicalAllowance: empDef.medicalAllowance.toFixed(2),
            conveyanceAllowance: empDef.conveyanceAllowance.toFixed(2),
            otherAllowance: empDef.otherAllowance.toFixed(2),
            providentFundDeduction: empDef.providentFundDeduction.toFixed(2),
          });
          await queryRunner.manager.save(structure);
          salaryStructuresCreated++;
        }
      }

      // Refresh all structures
      const allStructures = await queryRunner.manager.find(SalaryStructureEntity, { where: { storeId } });
      const structureByEmployeeId = new Map(allStructures.map((s) => [s.employeeId, s]));

      // 5. Seed Payroll Runs and Payslips
      for (const runDef of DEMO_RUNS) {
        let run = await queryRunner.manager.findOne(PayrollRunEntity, {
          where: { storeId, month: runDef.month, year: runDef.year },
        });

        if (!run) {
          run = queryRunner.manager.create(PayrollRunEntity, {
            tenantId,
            storeId,
            month: runDef.month,
            year: runDef.year,
            status: runDef.status,
            paymentStatus: runDef.paymentStatus,
            finalizedAt: runDef.finalizedAt,
            paidAt: runDef.paidAt,
            createdByUserId: userId,
            approvedByUserId: runDef.finalizedAt ? userId : undefined,
            totalGrossAmount: '0.00',
            totalDeductions: '0.00',
            totalNetAmount: '0.00',
            totalPaidAmount: '0.00',
            paidEmployeeCount: 0,
            skippedEmployeeCount: 0,
          });
          run = await queryRunner.manager.save(run);
          payrollRunsCreated++;

          const fiscalYear = this.computeTaxService.getFiscalYear(runDef.month, runDef.year);
          const taxSlabs = await queryRunner.manager.find(TaxSlabEntity, {
            where: { storeId, fiscalYear },
            order: { sortOrder: 'ASC' },
          });

          let totalGross = 0;
          let totalDeductions = 0;
          let totalNet = 0;
          let totalPaid = 0;
          let paidEmployeesCount = 0;
          let skippedCount = 0;

          const numEmployeesToMarkPaid = Math.round(activeEmployeesForPayroll.length * runDef.paidEmployeesFraction);

          let empIndex = 0;
          for (const employee of activeEmployeesForPayroll) {
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
            const monthlyTax =
              taxSlabs.length > 0 ? this.computeTaxService.computeAnnualTax(taxSlabs, gross * 12).monthlyTax : 0;
            const deductions = providentFund + monthlyTax;
            const net = gross - deductions;

            const isThisEmployeePaid = empIndex < numEmployeesToMarkPaid && runDef.status !== PayrollRunStatusEnum.DRAFT;
            empIndex++;

            const paymentStatus = isThisEmployeePaid ? SalaryPaymentStatusEnum.PAID : SalaryPaymentStatusEnum.UNPAID;
            const paidAmount = isThisEmployeePaid ? net.toFixed(2) : '0.00';
            const paidAt = isThisEmployeePaid ? runDef.paidAt || new Date('2026-08-31T18:00:00Z') : undefined;
            const paymentMethod = isThisEmployeePaid ? SalaryPaymentMethodEnum.CASH : undefined;
            const paymentReference = isThisEmployeePaid ? `VOUCHER-${employee.employeeCode}-${runDef.year}${String(runDef.month).padStart(2, '0')}` : undefined;

            if (isThisEmployeePaid) {
              paidEmployeesCount++;
              totalPaid += net;
            }

            const payslip = queryRunner.manager.create(PayslipEntity, {
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
              netSalary: net.toFixed(2),
              paymentStatus,
              paymentMethod,
              paidAmount,
              paidAt,
              paidByUserId: isThisEmployeePaid ? userId : undefined,
              paymentReference,
            });
            await queryRunner.manager.save(payslip);
            payslipsCreated++;

            totalGross += gross;
            totalDeductions += deductions;
            totalNet += net;
          }

          run.totalGrossAmount = totalGross.toFixed(2);
          run.totalDeductions = totalDeductions.toFixed(2);
          run.totalNetAmount = totalNet.toFixed(2);
          run.totalPaidAmount = totalPaid.toFixed(2);
          run.paidEmployeeCount = paidEmployeesCount;
          run.skippedEmployeeCount = skippedCount;
          await queryRunner.manager.save(run);
        }
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Seeded demo payroll for store ${storeId}: ${payrollRunsCreated} runs, ${payslipsCreated} payslips, ${employeesCreated} employees, ${departmentsCreated} departments.`,
      );

      return {
        success: true,
        message: 'Successfully seeded realistic payroll demo records.',
        departmentsCreated,
        employeesCreated,
        taxSlabsCreated,
        salaryStructuresCreated,
        payrollRunsCreated,
        payslipsCreated,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to seed demo payroll data: ${(err as Error).message}`, (err as Error).stack);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
