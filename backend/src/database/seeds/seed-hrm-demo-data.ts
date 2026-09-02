import * as dotenv from 'dotenv';
dotenv.config();

import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { StoreEntity } from '../../modules/tenant/entities/store.entity';
import { UserEntity, UserRoleEnum } from '../../modules/user/entities/user.entity';
import { StaffMemberEntity, StaffStatusEnum } from '../../modules/staff/entities/staff.entity';
import { DepartmentEntity } from '../../modules/hrm/entities/department.entity';
import { EmployeeEntity, EmploymentTypeEnum, EmploymentStatusEnum, EmployeeGenderEnum } from '../../modules/hrm/entities/employee.entity';
import { AttendanceEntity, AttendanceStatusEnum } from '../../modules/hrm/entities/attendance.entity';
import { HolidayEntity } from '../../modules/hrm/entities/holiday.entity';
import { LeavePolicyEntity } from '../../modules/hrm/entities/leave-policy.entity';
import { LeaveRequestEntity, LeaveTypeEnum, LeaveStatusEnum } from '../../modules/hrm/entities/leave-request.entity';
import { ShiftEntity } from '../../modules/hrm/entities/shift.entity';
import { ShiftAssignmentEntity } from '../../modules/hrm/entities/shift-assignment.entity';
import { ExpenseEntity, ExpenseCategoryEnum, ExpenseStatusEnum } from '../../modules/hrm/entities/expense.entity';
import { SalaryStructureEntity } from '../../modules/hrm/entities/salary-structure.entity';
import { PayrollRunEntity, PayrollRunStatusEnum } from '../../modules/hrm/entities/payroll-run.entity';
import { PayslipEntity } from '../../modules/hrm/entities/payslip.entity';
import { TaxSlabEntity } from '../../modules/hrm/entities/tax-slab.entity';
import { NoticeEntity, NoticePriorityEnum } from '../../modules/hrm/entities/notice.entity';

const SELF_SERVICE_EMAIL = 'employee1@bitcommerce.app';
const SELF_SERVICE_PASSWORD = 'EmployeeTest123!';

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weighted<T>(pairs: Array<[T, number]>): T {
  const total = pairs.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [value, w] of pairs) {
    r -= w;
    if (r <= 0) return value;
  }
  return pairs[0][0];
}

function fiscalYearOf(month: number, year: number): string {
  const startYear = month >= 7 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

function atTime(date: Date, hh: number, mm: number): Date {
  const d = new Date(date);
  d.setHours(hh, mm, 0, 0);
  return d;
}

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ERROR: HRM demo seeder cannot run in production environment.');
    process.exit(1);
  }

  console.log('🌱 Starting BitCommerce HRM Master Demo Data Seeder for ALL stores...');
  await AppDataSource.initialize();
  console.log('✅ Database connected.');

  const storeRepo = AppDataSource.getRepository(StoreEntity);
  const userRepo = AppDataSource.getRepository(UserEntity);
  const staffRepo = AppDataSource.getRepository(StaffMemberEntity);
  const departmentRepo = AppDataSource.getRepository(DepartmentEntity);
  const employeeRepo = AppDataSource.getRepository(EmployeeEntity);
  const attendanceRepo = AppDataSource.getRepository(AttendanceEntity);
  const holidayRepo = AppDataSource.getRepository(HolidayEntity);
  const leavePolicyRepo = AppDataSource.getRepository(LeavePolicyEntity);
  const leaveRequestRepo = AppDataSource.getRepository(LeaveRequestEntity);
  const shiftRepo = AppDataSource.getRepository(ShiftEntity);
  const shiftAssignmentRepo = AppDataSource.getRepository(ShiftAssignmentEntity);
  const expenseRepo = AppDataSource.getRepository(ExpenseEntity);
  const salaryStructureRepo = AppDataSource.getRepository(SalaryStructureEntity);
  const payrollRunRepo = AppDataSource.getRepository(PayrollRunEntity);
  const payslipRepo = AppDataSource.getRepository(PayslipEntity);
  const taxSlabRepo = AppDataSource.getRepository(TaxSlabEntity);
  const noticeRepo = AppDataSource.getRepository(NoticeEntity);

  const stores = await storeRepo.find();
  if (stores.length === 0) {
    console.error('❌ No stores found. Run "npm run seed" first to create stores.');
    process.exit(1);
  }

  for (const store of stores) {
    console.log(`\n======================================================`);
    console.log(`🏢 Seeding HRM for Store: "${store.name}" (${store.id}) [Tenant: ${store.tenantId}]`);
    console.log(`======================================================`);

    const tenantId = store.tenantId;
    const storeId = store.id;
    const merchant = (await userRepo.findOne({ where: { id: store.ownerId } })) ||
                     (await userRepo.findOne({ where: { role: UserRoleEnum.SUPER_ADMIN } })) ||
                     (await userRepo.findOne({ where: {} }));

    // ─── 1. Departments ──────────────────────────────────────────────
    const departmentDefs = ['Sales', 'Warehouse', 'Customer Support', 'Marketing', 'IT'];
    const departments: DepartmentEntity[] = [];
    for (const name of departmentDefs) {
      let dept = await departmentRepo.findOne({ where: { storeId, name } });
      if (!dept) {
        dept = await departmentRepo.save(departmentRepo.create({ tenantId, storeId, name, isActive: true }));
      }
      departments.push(dept);
    }
    console.log(`✅ Seeded ${departments.length} departments.`);

    // ─── 2. Employees ────────────────────────────────────────────────
    const employeeDefs: Array<{
      fullName: string;
      designation: string;
      dept: DepartmentEntity;
      type: EmploymentTypeEnum;
      status: EmploymentStatusEnum;
      joinedDaysAgo: number;
      gender: EmployeeGenderEnum;
    }> = [
      { fullName: 'Rahim Uddin', designation: 'Sales Executive', dept: departments[0], type: EmploymentTypeEnum.FULL_TIME, status: EmploymentStatusEnum.ACTIVE, joinedDaysAgo: 620, gender: EmployeeGenderEnum.MALE },
      { fullName: 'Karim Ahmed', designation: 'Senior Sales Executive', dept: departments[0], type: EmploymentTypeEnum.FULL_TIME, status: EmploymentStatusEnum.ACTIVE, joinedDaysAgo: 900, gender: EmployeeGenderEnum.MALE },
      { fullName: 'Fatima Begum', designation: 'Sales Associate', dept: departments[0], type: EmploymentTypeEnum.PART_TIME, status: EmploymentStatusEnum.ACTIVE, joinedDaysAgo: 210, gender: EmployeeGenderEnum.FEMALE },
      { fullName: 'Nasrin Akter', designation: 'Sales Coordinator', dept: departments[0], type: EmploymentTypeEnum.FULL_TIME, status: EmploymentStatusEnum.ON_LEAVE, joinedDaysAgo: 540, gender: EmployeeGenderEnum.FEMALE },
      { fullName: 'Jahangir Alam', designation: 'Warehouse Supervisor', dept: departments[1], type: EmploymentTypeEnum.FULL_TIME, status: EmploymentStatusEnum.ACTIVE, joinedDaysAgo: 730, gender: EmployeeGenderEnum.MALE },
      { fullName: 'Habibur Rahman', designation: 'Warehouse Associate', dept: departments[1], type: EmploymentTypeEnum.FULL_TIME, status: EmploymentStatusEnum.ACTIVE, joinedDaysAgo: 365, gender: EmployeeGenderEnum.MALE },
      { fullName: 'Shafiqul Islam', designation: 'Forklift Operator', dept: departments[1], type: EmploymentTypeEnum.CONTRACT, status: EmploymentStatusEnum.ACTIVE, joinedDaysAgo: 95, gender: EmployeeGenderEnum.MALE },
      { fullName: 'Mizanur Rahman', designation: 'Inventory Clerk', dept: departments[1], type: EmploymentTypeEnum.FULL_TIME, status: EmploymentStatusEnum.TERMINATED, joinedDaysAgo: 800, gender: EmployeeGenderEnum.MALE },
      { fullName: 'Sultana Razia', designation: 'Support Team Lead', dept: departments[2], type: EmploymentTypeEnum.FULL_TIME, status: EmploymentStatusEnum.ACTIVE, joinedDaysAgo: 480, gender: EmployeeGenderEnum.FEMALE },
      { fullName: 'Tanvir Hasan', designation: 'Customer Support Agent', dept: departments[2], type: EmploymentTypeEnum.FULL_TIME, status: EmploymentStatusEnum.ACTIVE, joinedDaysAgo: 300, gender: EmployeeGenderEnum.MALE },
      { fullName: 'Mim Akter', designation: 'Customer Support Agent', dept: departments[2], type: EmploymentTypeEnum.FULL_TIME, status: EmploymentStatusEnum.ACTIVE, joinedDaysAgo: 150, gender: EmployeeGenderEnum.FEMALE },
      { fullName: 'Anisur Rahman', designation: 'Marketing Manager', dept: departments[3], type: EmploymentTypeEnum.FULL_TIME, status: EmploymentStatusEnum.ACTIVE, joinedDaysAgo: 700, gender: EmployeeGenderEnum.MALE },
      { fullName: 'Nusrat Jahan', designation: 'Content Strategist', dept: departments[3], type: EmploymentTypeEnum.FULL_TIME, status: EmploymentStatusEnum.ACTIVE, joinedDaysAgo: 420, gender: EmployeeGenderEnum.FEMALE },
      { fullName: 'Kazi Farhan', designation: 'Social Media Intern', dept: departments[3], type: EmploymentTypeEnum.INTERN, status: EmploymentStatusEnum.ACTIVE, joinedDaysAgo: 40, gender: EmployeeGenderEnum.MALE },
      { fullName: 'Rezaul Karim', designation: 'Systems Administrator', dept: departments[4], type: EmploymentTypeEnum.FULL_TIME, status: EmploymentStatusEnum.ACTIVE, joinedDaysAgo: 660, gender: EmployeeGenderEnum.MALE },
      { fullName: 'Mahmudul Hasan', designation: 'Software Engineer', dept: departments[4], type: EmploymentTypeEnum.FULL_TIME, status: EmploymentStatusEnum.ACTIVE, joinedDaysAgo: 260, gender: EmployeeGenderEnum.MALE },
    ];

    const employees: EmployeeEntity[] = [];
    for (let i = 0; i < employeeDefs.length; i++) {
      const def = employeeDefs[i];
      const employeeCode = `EMP-${String(i + 1).padStart(4, '0')}`;
      let emp = await employeeRepo.findOne({ where: { storeId, employeeCode } });
      if (!emp) {
        const storeSlugSafe = store.slug || 'store';
        emp = await employeeRepo.save(
          employeeRepo.create({
            tenantId,
            storeId,
            departmentId: def.dept.id,
            employeeCode,
            fullName: def.fullName,
            email: i === 0 && store.slug === 'mydiagnostic'
              ? SELF_SERVICE_EMAIL
              : `${def.fullName.toLowerCase().replace(/\s+/g, '.')}.${storeSlugSafe.slice(0, 5)}@bitcommerce.example`,
            phone: `+8801${700000000 + i * 111}`,
            designation: def.designation,
            employmentType: def.type,
            employmentStatus: def.status,
            dateOfJoining: iso(daysAgo(def.joinedDaysAgo)),
            gender: def.gender,
            address: 'Dhaka, Bangladesh',
            emergencyContactName: 'Emergency Contact',
            emergencyContactPhone: `+8801${600000000 + i * 222}`,
          }),
        );
      }
      employees.push(emp);
    }
    const activeEmployees = employees.filter((e) => e.employmentStatus === EmploymentStatusEnum.ACTIVE);
    console.log(`✅ Seeded ${employees.length} employees (${activeEmployees.length} active).`);

    // ─── 3. Self-service demo login for mydiagnostic (or first store) ─
    if (store.slug === 'mydiagnostic' || store === stores[0]) {
      let selfServiceUser = await userRepo.findOne({ where: { email: SELF_SERVICE_EMAIL } });
      if (!selfServiceUser) {
        selfServiceUser = await userRepo.save(
          userRepo.create({
            email: SELF_SERVICE_EMAIL,
            fullName: employees[0].fullName,
            passwordHash: bcrypt.hashSync(SELF_SERVICE_PASSWORD, 10),
            phone: employees[0].phone,
            role: UserRoleEnum.STORE_STAFF,
            tenantId,
            isActive: true,
          }),
        );
      }
      let selfServiceStaff = await staffRepo.findOne({ where: { storeId, email: SELF_SERVICE_EMAIL } });
      if (!selfServiceStaff) {
        selfServiceStaff = await staffRepo.save(
          staffRepo.create({
            tenantId,
            storeId,
            userId: selfServiceUser.id,
            name: employees[0].fullName,
            email: SELF_SERVICE_EMAIL,
            role: 'Employee (Self-Service)',
            permissions: ['hr:leave:self'],
            status: StaffStatusEnum.ACTIVE,
            invitedByUserId: merchant?.id,
          }),
        );
      }
      if (!employees[0].linkedUserId) {
        employees[0].linkedUserId = selfServiceUser.id;
        await employeeRepo.save(employees[0]);
      }
    }

    // ─── 4. Attendance (past 10 days) ────────────────────────────────
    const attendanceStatusWeights: Array<[AttendanceStatusEnum, number]> = [
      [AttendanceStatusEnum.PRESENT, 80],
      [AttendanceStatusEnum.LATE, 10],
      [AttendanceStatusEnum.ABSENT, 5],
      [AttendanceStatusEnum.HALF_DAY, 3],
      [AttendanceStatusEnum.ON_LEAVE, 2],
    ];
    let attendanceCount = 0;
    for (const emp of activeEmployees) {
      for (let d = 0; d < 10; d++) {
        const date = daysAgo(d);
        const dateStr = iso(date);
        const exists = await attendanceRepo.findOne({ where: { employeeId: emp.id, date: dateStr } });
        if (exists) continue;

        const status = weighted(attendanceStatusWeights);
        const record = attendanceRepo.create({
          tenantId,
          storeId,
          employeeId: emp.id,
          date: dateStr,
          status,
          markedByUserId: merchant?.id,
        });
        if (status === AttendanceStatusEnum.PRESENT || status === AttendanceStatusEnum.LATE || status === AttendanceStatusEnum.HALF_DAY) {
          const checkInHour = status === AttendanceStatusEnum.LATE ? 10 : 9;
          record.checkInAt = atTime(date, checkInHour, Math.floor(Math.random() * 30));
          if (status !== AttendanceStatusEnum.HALF_DAY || d > 0) {
            record.checkOutAt = atTime(date, status === AttendanceStatusEnum.HALF_DAY ? 13 : 18, Math.floor(Math.random() * 30));
          }
        }
        await attendanceRepo.save(record);
        attendanceCount++;
      }
    }
    console.log(`✅ Seeded ${attendanceCount} attendance records.`);

    // ─── 5. Holidays ─────────────────────────────────────────────────
    const year = new Date().getFullYear();
    const holidayDefs = [
      { name: "New Year's Day", date: `${year}-01-01` },
      { name: 'Language Movement Day', date: `${year}-02-21` },
      { name: 'Independence Day', date: `${year}-03-26` },
      { name: 'Company Anniversary', date: iso(daysAgo(45)) },
      { name: 'Victory Day', date: `${year}-12-16` },
      { name: 'Winter Break', date: iso(daysFromNow(60)) },
    ];
    for (const h of holidayDefs) {
      const exists = await holidayRepo.findOne({ where: { storeId, date: h.date } });
      if (!exists) {
        await holidayRepo.save(holidayRepo.create({ tenantId, storeId, name: h.name, date: h.date }));
      }
    }

    // ─── 6. Leave Policy ─────────────────────────────────────────────
    let leavePolicy = await leavePolicyRepo.findOne({ where: { storeId } });
    if (!leavePolicy) {
      leavePolicy = await leavePolicyRepo.save(
        leavePolicyRepo.create({ tenantId, storeId, earnedDaysPerYear: 15, casualDaysPerYear: 10, sickDaysPerYear: 14 }),
      );
    }

    // ─── 7. Leave Requests ───────────────────────────────────────────
    const existingLeaveCount = await leaveRequestRepo.count({ where: { storeId } });
    if (existingLeaveCount === 0) {
      const leaveDefs: Array<{ empIdx: number; type: LeaveTypeEnum; startDaysAgo: number; days: number; status: LeaveStatusEnum; reason: string }> = [
        { empIdx: 0, type: LeaveTypeEnum.CASUAL, startDaysAgo: -5, days: 2, status: LeaveStatusEnum.PENDING, reason: 'Family function' },
        { empIdx: 1, type: LeaveTypeEnum.EARNED, startDaysAgo: -10, days: 3, status: LeaveStatusEnum.PENDING, reason: 'Vacation with family' },
        { empIdx: 2, type: LeaveTypeEnum.SICK, startDaysAgo: -2, days: 1, status: LeaveStatusEnum.PENDING, reason: 'Fever' },
        { empIdx: 4, type: LeaveTypeEnum.CASUAL, startDaysAgo: -15, days: 1, status: LeaveStatusEnum.PENDING, reason: 'Personal errand' },
        { empIdx: 3, type: LeaveTypeEnum.SICK, startDaysAgo: 3, days: 4, status: LeaveStatusEnum.APPROVED, reason: 'Recovering from surgery' },
        { empIdx: 5, type: LeaveTypeEnum.EARNED, startDaysAgo: 8, days: 5, status: LeaveStatusEnum.APPROVED, reason: 'Annual trip to hometown' },
        { empIdx: 6, type: LeaveTypeEnum.CASUAL, startDaysAgo: 4, days: 1, status: LeaveStatusEnum.APPROVED, reason: 'Bank work' },
        { empIdx: 8, type: LeaveTypeEnum.CASUAL, startDaysAgo: 12, days: 2, status: LeaveStatusEnum.APPROVED, reason: 'Wedding ceremony' },
        { empIdx: 9, type: LeaveTypeEnum.SICK, startDaysAgo: 6, days: 2, status: LeaveStatusEnum.APPROVED, reason: 'Flu' },
        { empIdx: 10, type: LeaveTypeEnum.EARNED, startDaysAgo: 20, days: 3, status: LeaveStatusEnum.APPROVED, reason: 'Family vacation' },
        { empIdx: 11, type: LeaveTypeEnum.CASUAL, startDaysAgo: 9, days: 1, status: LeaveStatusEnum.APPROVED, reason: "Child's school event" },
        { empIdx: 12, type: LeaveTypeEnum.SICK, startDaysAgo: 14, days: 2, status: LeaveStatusEnum.APPROVED, reason: 'Migraine' },
        { empIdx: 0, type: LeaveTypeEnum.EARNED, startDaysAgo: 40, days: 4, status: LeaveStatusEnum.REJECTED, reason: 'Overlaps with peak season' },
        { empIdx: 2, type: LeaveTypeEnum.CASUAL, startDaysAgo: 25, days: 2, status: LeaveStatusEnum.REJECTED, reason: 'Insufficient notice' },
        { empIdx: 5, type: LeaveTypeEnum.SICK, startDaysAgo: 30, days: 1, status: LeaveStatusEnum.REJECTED, reason: 'No supporting document' },
        { empIdx: 1, type: LeaveTypeEnum.CASUAL, startDaysAgo: 18, days: 1, status: LeaveStatusEnum.CANCELLED, reason: 'Plans changed' },
        { empIdx: 8, type: LeaveTypeEnum.EARNED, startDaysAgo: 35, days: 2, status: LeaveStatusEnum.CANCELLED, reason: 'No longer needed' },
        { empIdx: 14, type: LeaveTypeEnum.SICK, startDaysAgo: 22, days: 1, status: LeaveStatusEnum.CANCELLED, reason: 'Felt better' },
      ];

      for (const def of leaveDefs) {
        const emp = employees[def.empIdx];
        if (!emp) continue;
        const start = def.startDaysAgo >= 0 ? daysAgo(def.startDaysAgo) : daysFromNow(-def.startDaysAgo);
        const end = new Date(start);
        end.setDate(end.getDate() + def.days - 1);

        const request = leaveRequestRepo.create({
          tenantId,
          storeId,
          employeeId: emp.id,
          leaveType: def.type,
          startDate: iso(start),
          endDate: iso(end),
          totalDays: def.days,
          reason: def.reason,
          status: def.status,
          createdByUserId: merchant?.id,
        });
        if (def.status === LeaveStatusEnum.APPROVED || def.status === LeaveStatusEnum.REJECTED) {
          request.reviewedByUserId = merchant?.id;
          request.reviewedAt = daysAgo(Math.max(0, def.startDaysAgo - 1));
          request.reviewNote = def.status === LeaveStatusEnum.REJECTED ? def.reason : undefined;
        }
        await leaveRequestRepo.save(request);
      }
      console.log(`✅ Seeded ${leaveDefs.length} leave requests.`);
    }

    // ─── 8. Shifts + Roster ──────────────────────────────────────────
    const shiftDefs = [
      { name: 'Morning Shift', startTime: '09:00', endTime: '17:00', colorTag: '#2563EB' },
      { name: 'Evening Shift', startTime: '17:00', endTime: '23:00', colorTag: '#D97706' },
      { name: 'Night Shift', startTime: '23:00', endTime: '07:00', colorTag: '#7C3AED' },
    ];
    const shifts: ShiftEntity[] = [];
    for (const s of shiftDefs) {
      let shift = await shiftRepo.findOne({ where: { storeId, name: s.name } });
      if (!shift) {
        shift = await shiftRepo.save(shiftRepo.create({ tenantId, storeId, ...s, isActive: true }));
      }
      shifts.push(shift);
    }

    const mondayOfThisWeek = (() => {
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      now.setDate(now.getDate() + diff);
      return now;
    })();
    for (let d = 0; d < 5; d++) {
      const date = new Date(mondayOfThisWeek);
      date.setDate(date.getDate() + d);
      const dateStr = iso(date);
      for (const emp of activeEmployees.slice(0, 10)) {
        const exists = await shiftAssignmentRepo.findOne({ where: { employeeId: emp.id, date: dateStr } });
        if (exists) continue;
        const shift = pick(shifts.slice(0, 2));
        await shiftAssignmentRepo.save(
          shiftAssignmentRepo.create({
            tenantId,
            storeId,
            employeeId: emp.id,
            shiftId: shift.id,
            date: dateStr,
            assignedByUserId: merchant?.id,
          }),
        );
      }
    }
    console.log(`✅ Seeded shifts & weekly shift assignments.`);

    // ─── 9. Expenses ─────────────────────────────────────────────────
    const existingExpenseCount = await expenseRepo.count({ where: { storeId } });
    if (existingExpenseCount === 0) {
      const expenseDefs: Array<{ empIdx: number; category: ExpenseCategoryEnum; amount: string; daysAgo: number; status: ExpenseStatusEnum; description: string }> = [
        { empIdx: 0, category: ExpenseCategoryEnum.TRAVEL, amount: '2500.00', daysAgo: 2, status: ExpenseStatusEnum.PENDING, description: 'Client visit to Chattogram' },
        { empIdx: 1, category: ExpenseCategoryEnum.MEALS, amount: '850.00', daysAgo: 3, status: ExpenseStatusEnum.PENDING, description: 'Team lunch with vendor' },
        { empIdx: 9, category: ExpenseCategoryEnum.OFFICE_SUPPLIES, amount: '1200.00', daysAgo: 1, status: ExpenseStatusEnum.PENDING, description: 'Printer cartridges and stationery' },
        { empIdx: 14, category: ExpenseCategoryEnum.UTILITIES, amount: '3400.00', daysAgo: 4, status: ExpenseStatusEnum.PENDING, description: 'Server room AC repair' },
        { empIdx: 4, category: ExpenseCategoryEnum.TRAVEL, amount: '1800.00', daysAgo: 10, status: ExpenseStatusEnum.APPROVED, description: 'Warehouse site visit' },
        { empIdx: 11, category: ExpenseCategoryEnum.OTHER, amount: '2200.00', daysAgo: 8, status: ExpenseStatusEnum.APPROVED, description: 'Promotional banners' },
        { empIdx: 5, category: ExpenseCategoryEnum.ACCOMMODATION, amount: '4500.00', daysAgo: 12, status: ExpenseStatusEnum.APPROVED, description: 'Overnight stay for training' },
        { empIdx: 12, category: ExpenseCategoryEnum.MEALS, amount: '650.00', daysAgo: 6, status: ExpenseStatusEnum.APPROVED, description: 'Client dinner meeting' },
        { empIdx: 2, category: ExpenseCategoryEnum.MEDICAL, amount: '5200.00', daysAgo: 30, status: ExpenseStatusEnum.REJECTED, description: 'Medical claim missing receipt' },
        { empIdx: 6, category: ExpenseCategoryEnum.TRAVEL, amount: '900.00', daysAgo: 25, status: ExpenseStatusEnum.REJECTED, description: 'Personal trip miscategorized' },
        { empIdx: 8, category: ExpenseCategoryEnum.OTHER, amount: '1500.00', daysAgo: 5, status: ExpenseStatusEnum.REIMBURSED, description: 'Customer support software subscription' },
        { empIdx: 10, category: ExpenseCategoryEnum.TRAVEL, amount: '2100.00', daysAgo: 7, status: ExpenseStatusEnum.REIMBURSED, description: 'Field visit fuel cost' },
        { empIdx: 13, category: ExpenseCategoryEnum.OFFICE_SUPPLIES, amount: '750.00', daysAgo: 9, status: ExpenseStatusEnum.REIMBURSED, description: 'Design software license' },
        { empIdx: 15, category: ExpenseCategoryEnum.UTILITIES, amount: '1300.00', daysAgo: 3, status: ExpenseStatusEnum.REIMBURSED, description: 'Cloud hosting overage' },
      ];

      for (const def of expenseDefs) {
        const emp = employees[def.empIdx];
        if (!emp) continue;
        const expense = expenseRepo.create({
          tenantId,
          storeId,
          employeeId: emp.id,
          category: def.category,
          amount: def.amount,
          currency: 'BDT',
          expenseDate: iso(daysAgo(def.daysAgo)),
          description: def.description,
          status: def.status,
          createdByUserId: merchant?.id,
        });
        if (def.status !== ExpenseStatusEnum.PENDING) {
          expense.reviewedByUserId = merchant?.id;
          expense.reviewedAt = daysAgo(Math.max(0, def.daysAgo - 1));
        }
        if (def.status === ExpenseStatusEnum.REIMBURSED) {
          expense.reimbursedAt = daysAgo(Math.max(0, def.daysAgo - 2));
        }
        if (def.status === ExpenseStatusEnum.REJECTED) {
          expense.reviewNote = 'Please resubmit with a valid receipt.';
        }
        await expenseRepo.save(expense);
      }
      console.log(`✅ Seeded ${expenseDefs.length} HR expenses.`);
    }

    // ─── 10. Salary Structures ───────────────────────────────────────
    const skipSalaryForIdx = new Set([2, 7, 13]);
    const salaryDefs: Record<number, { basic: string; hra: string; medical: string; conveyance: string; pf: string }> = {
      0: { basic: '32000.00', hra: '9600.00', medical: '2000.00', conveyance: '1500.00', pf: '1600.00' },
      1: { basic: '38000.00', hra: '11400.00', medical: '2000.00', conveyance: '1500.00', pf: '1900.00' },
      3: { basic: '30000.00', hra: '9000.00', medical: '2000.00', conveyance: '1500.00', pf: '1500.00' },
      4: { basic: '35000.00', hra: '10500.00', medical: '2000.00', conveyance: '1500.00', pf: '1750.00' },
      5: { basic: '26000.00', hra: '7800.00', medical: '1500.00', conveyance: '1000.00', pf: '1300.00' },
      6: { basic: '22000.00', hra: '6600.00', medical: '1500.00', conveyance: '1000.00', pf: '1100.00' },
      8: { basic: '34000.00', hra: '10200.00', medical: '2000.00', conveyance: '1500.00', pf: '1700.00' },
      9: { basic: '25000.00', hra: '7500.00', medical: '1500.00', conveyance: '1000.00', pf: '1250.00' },
      10: { basic: '25000.00', hra: '7500.00', medical: '1500.00', conveyance: '1000.00', pf: '1250.00' },
      11: { basic: '45000.00', hra: '13500.00', medical: '2500.00', conveyance: '2000.00', pf: '2250.00' },
      12: { basic: '32000.00', hra: '9600.00', medical: '2000.00', conveyance: '1500.00', pf: '1600.00' },
      14: { basic: '48000.00', hra: '14400.00', medical: '2500.00', conveyance: '2000.00', pf: '2400.00' },
      15: { basic: '42000.00', hra: '12600.00', medical: '2500.00', conveyance: '2000.00', pf: '2100.00' },
    };
    for (const [idxStr, s] of Object.entries(salaryDefs)) {
      const idx = Number(idxStr);
      if (skipSalaryForIdx.has(idx)) continue;
      const emp = employees[idx];
      if (!emp) continue;
      const exists = await salaryStructureRepo.findOne({ where: { employeeId: emp.id } });
      if (!exists) {
        await salaryStructureRepo.save(
          salaryStructureRepo.create({
            tenantId,
            storeId,
            employeeId: emp.id,
            basicSalary: s.basic,
            houseRentAllowance: s.hra,
            medicalAllowance: s.medical,
            conveyanceAllowance: s.conveyance,
            otherAllowance: '0.00',
            providentFundDeduction: s.pf,
          }),
        );
      }
    }
    console.log(`✅ Seeded salary structures.`);

    // ─── 11. Payroll Runs & Payslips ─────────────────────────────────
    const now = new Date();
    const runPeriods = [
      { monthsAgo: 1, status: PayrollRunStatusEnum.PAID },
      { monthsAgo: 0, status: PayrollRunStatusEnum.DRAFT },
    ];
    for (const period of runPeriods) {
      const runDate = new Date(now.getFullYear(), now.getMonth() - period.monthsAgo, 1);
      const month = runDate.getMonth() + 1;
      const runYear = runDate.getFullYear();

      let run = await payrollRunRepo.findOne({ where: { storeId, month, year: runYear } });
      if (run) continue;

      const structures = await salaryStructureRepo.find({ where: { storeId } });
      const structureByEmployeeId = new Map(structures.map((s) => [s.employeeId, s]));

      run = await payrollRunRepo.save(
        payrollRunRepo.create({ tenantId, storeId, month, year: runYear, status: PayrollRunStatusEnum.DRAFT, createdByUserId: merchant?.id }),
      );

      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;
      let skippedCount = 0;

      for (const emp of activeEmployees) {
        const structure = structureByEmployeeId.get(emp.id);
        if (!structure) {
          skippedCount++;
          continue;
        }
        const basic = Number(structure.basicSalary);
        const hra = Number(structure.houseRentAllowance);
        const medical = Number(structure.medicalAllowance);
        const conveyance = Number(structure.conveyanceAllowance);
        const other = Number(structure.otherAllowance);
        const pf = Number(structure.providentFundDeduction);
        const gross = basic + hra + medical + conveyance + other;
        const net = gross - pf;

        await payslipRepo.save(
          payslipRepo.create({
            tenantId,
            storeId,
            payrollRunId: run.id,
            employeeId: emp.id,
            basicSalary: basic.toFixed(2),
            houseRentAllowance: hra.toFixed(2),
            medicalAllowance: medical.toFixed(2),
            conveyanceAllowance: conveyance.toFixed(2),
            otherAllowance: other.toFixed(2),
            grossSalary: gross.toFixed(2),
            providentFundDeduction: pf.toFixed(2),
            taxDeduction: '0.00',
            otherDeductions: '0.00',
            netSalary: net.toFixed(2),
          }),
        );

        totalGross += gross;
        totalDeductions += pf;
        totalNet += net;
      }

      run.totalGrossAmount = totalGross.toFixed(2);
      run.totalDeductions = totalDeductions.toFixed(2);
      run.totalNetAmount = totalNet.toFixed(2);
      run.skippedEmployeeCount = skippedCount;
      run.status = period.status;
      if (period.status === PayrollRunStatusEnum.PAID) {
        run.finalizedAt = daysAgo(20);
        run.paidAt = daysAgo(18);
      }
      await payrollRunRepo.save(run);
    }
    console.log(`✅ Seeded payroll runs and payslips.`);

    // ─── 12. Tax Slabs ───────────────────────────────────────────────
    const fiscalYear = fiscalYearOf(now.getMonth() + 1, now.getFullYear());
    const existingSlabs = await taxSlabRepo.count({ where: { storeId, fiscalYear } });
    if (existingSlabs === 0) {
      const slabDefs = [
        { min: '0.00', max: '350000.00', rate: '0.00' },
        { min: '350000.00', max: '700000.00', rate: '10.00' },
        { min: '700000.00', max: undefined, rate: '15.00' },
      ];
      for (let i = 0; i < slabDefs.length; i++) {
        const s = slabDefs[i];
        await taxSlabRepo.save(
          taxSlabRepo.create({
            tenantId,
            storeId,
            fiscalYear,
            minAmount: s.min,
            maxAmount: s.max,
            ratePercent: s.rate,
            sortOrder: i,
          }),
        );
      }
    }

    // ─── 13. Notices ─────────────────────────────────────────────────
    const noticeDefs = [
      { title: 'Scheduled server maintenance tonight', body: 'The dashboard will be briefly unavailable tonight between 11 PM and 12 AM for scheduled maintenance.', priority: NoticePriorityEnum.URGENT, isPinned: true, expiresInDays: 1 },
      { title: 'Office closed for Eid holidays', body: 'The office will remain closed for the Eid holidays. Check the Holidays page for exact dates.', priority: NoticePriorityEnum.IMPORTANT, isPinned: true, expiresInDays: undefined },
      { title: 'New coffee machine in the break room', body: 'Please remember to descale the new coffee machine weekly. Instructions are pinned above the sink.', priority: NoticePriorityEnum.NORMAL, isPinned: false, expiresInDays: undefined },
      { title: 'Quarterly all-hands meeting', body: 'Join us this Thursday at 4 PM in the main conference room for the quarterly review.', priority: NoticePriorityEnum.NORMAL, isPinned: false, expiresInDays: 10 },
      { title: 'Fire drill completed', body: 'Thank you all for participating in last week\'s fire drill. Feedback has been noted.', priority: NoticePriorityEnum.NORMAL, isPinned: false, expiresInDays: -5 },
    ];
    const existingNoticeCount = await noticeRepo.count({ where: { storeId } });
    if (existingNoticeCount === 0) {
      for (const n of noticeDefs) {
        await noticeRepo.save(
          noticeRepo.create({
            tenantId,
            storeId,
            title: n.title,
            body: n.body,
            priority: n.priority,
            isPinned: n.isPinned,
            expiresAt: n.expiresInDays !== undefined ? daysFromNow(n.expiresInDays) : undefined,
            createdByUserId: merchant?.id,
          }),
        );
      }
      console.log(`✅ Seeded ${noticeDefs.length} notice board announcements.`);
    }

    console.log(`🎉 Store "${store.name}" successfully seeded with all HRM demo data!`);
  }

  await AppDataSource.destroy();
  console.log('\n🌟 All stores successfully populated with comprehensive HRM demo data.');
}

seed().catch((err) => {
  console.error('❌ HRM demo seeding failed:', err);
  process.exit(1);
});
