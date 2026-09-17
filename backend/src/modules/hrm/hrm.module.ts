import { forwardRef, Module } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DepartmentEntity } from './entities/department.entity';
import { EmployeeEntity } from './entities/employee.entity';
import { AttendanceEntity } from './entities/attendance.entity';
import { HolidayEntity } from './entities/holiday.entity';
import { LeavePolicyEntity } from './entities/leave-policy.entity';
import { LeaveRequestEntity } from './entities/leave-request.entity';
import { ShiftEntity } from './entities/shift.entity';
import { ShiftAssignmentEntity } from './entities/shift-assignment.entity';
import { ExpenseEntity } from './entities/expense.entity';
import { SalaryStructureEntity } from './entities/salary-structure.entity';
import { PayrollRunEntity } from './entities/payroll-run.entity';
import { PayslipEntity } from './entities/payslip.entity';
import { TaxSlabEntity } from './entities/tax-slab.entity';
import { NoticeEntity } from './entities/notice.entity';
import { UserEntity } from '../user/entities/user.entity';
import { TenantModule } from '../tenant/tenant.module';
import { StaffModule } from '../staff/staff.module';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HrmController } from './hrm.controller';
import { CreateDepartmentService } from './services/create-department.service';
import { ListDepartmentsService } from './services/list-departments.service';
import { UpdateDepartmentService } from './services/update-department.service';
import { DeleteDepartmentService } from './services/delete-department.service';
import { CreateEmployeeService } from './services/create-employee.service';
import { ListEmployeesService } from './services/list-employees.service';
import { GetEmployeeService } from './services/get-employee.service';
import { UpdateEmployeeService } from './services/update-employee.service';
import { TerminateEmployeeService } from './services/terminate-employee.service';
import { CheckInService } from './services/check-in.service';
import { CheckOutService } from './services/check-out.service';
import { MarkAttendanceStatusService } from './services/mark-attendance-status.service';
import { ListAttendanceService } from './services/list-attendance.service';
import { CreateHolidayService } from './services/create-holiday.service';
import { ListHolidaysService } from './services/list-holidays.service';
import { UpdateHolidayService } from './services/update-holiday.service';
import { DeleteHolidayService } from './services/delete-holiday.service';
import { GetLeavePolicyService } from './services/get-leave-policy.service';
import { UpdateLeavePolicyService } from './services/update-leave-policy.service';
import { GetLeaveBalanceService } from './services/get-leave-balance.service';
import { CreateLeaveRequestService } from './services/create-leave-request.service';
import { ListLeaveRequestsService } from './services/list-leave-requests.service';
import { ReviewLeaveRequestService } from './services/review-leave-request.service';
import { CancelLeaveRequestService } from './services/cancel-leave-request.service';
import { UploadLeaveDocumentService } from './services/upload-leave-document.service';
import { GetLeaveDocumentService } from './services/get-leave-document.service';
import { CreateShiftService } from './services/create-shift.service';
import { ListShiftsService } from './services/list-shifts.service';
import { UpdateShiftService } from './services/update-shift.service';
import { DeleteShiftService } from './services/delete-shift.service';
import { AssignShiftService } from './services/assign-shift.service';
import { RemoveShiftAssignmentService } from './services/remove-shift-assignment.service';
import { ListRosterService } from './services/list-roster.service';
import { CreateExpenseService } from './services/create-expense.service';
import { ListExpensesService } from './services/list-expenses.service';
import { ReviewExpenseService } from './services/review-expense.service';
import { MarkExpenseReimbursedService } from './services/mark-expense-reimbursed.service';
import { DeleteExpenseService } from './services/delete-expense.service';
import { UploadExpenseReceiptService } from './services/upload-expense-receipt.service';
import { GetExpenseReceiptService } from './services/get-expense-receipt.service';
import { SetSalaryStructureService } from './services/set-salary-structure.service';
import { ListSalaryStructuresService } from './services/list-salary-structures.service';
import { GeneratePayrollRunService } from './services/generate-payroll-run.service';
import { ListPayrollRunsService } from './services/list-payroll-runs.service';
import { GetPayrollRunService } from './services/get-payroll-run.service';
import { FinalizePayrollRunService } from './services/finalize-payroll-run.service';
import { MarkPayrollRunPaidService } from './services/mark-payroll-run-paid.service';
import { DeletePayrollRunService } from './services/delete-payroll-run.service';
import { SeedPayrollDemoDataService } from './services/seed-payroll-demo-data.service';
import { GetTaxSlabsService } from './services/get-tax-slabs.service';
import { SetTaxSlabsService } from './services/set-tax-slabs.service';
import { ComputeTaxService } from './services/compute-tax.service';
import { EstimateTaxService } from './services/estimate-tax.service';
import { CreateNoticeService } from './services/create-notice.service';
import { ListNoticesService } from './services/list-notices.service';
import { UpdateNoticeService } from './services/update-notice.service';
import { DeleteNoticeService } from './services/delete-notice.service';
import { GetHrOverviewReportService } from './services/get-hr-overview-report.service';
import { GetMyEmployeeService } from './services/get-my-employee.service';
import { InviteEmployeeSelfServiceService } from './services/invite-employee-self-service.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DepartmentEntity,
      EmployeeEntity,
      AttendanceEntity,
      HolidayEntity,
      LeavePolicyEntity,
      LeaveRequestEntity,
      ShiftEntity,
      ShiftAssignmentEntity,
      ExpenseEntity,
      SalaryStructureEntity,
      PayrollRunEntity,
      PayslipEntity,
      TaxSlabEntity,
      NoticeEntity,
      UserEntity,
    ]),
    TenantModule,
    // Provides GetMyPermissionsService, the source of truth PermissionsGuard uses to
    // resolve an owner's/staff member's effective hr:* permissions for this store.
    StaffModule,
    FinanceModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'bitcommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [HrmController],
  providers: [
    CreateDepartmentService,
    ListDepartmentsService,
    UpdateDepartmentService,
    DeleteDepartmentService,
    CreateEmployeeService,
    ListEmployeesService,
    GetEmployeeService,
    UpdateEmployeeService,
    TerminateEmployeeService,
    CheckInService,
    CheckOutService,
    MarkAttendanceStatusService,
    ListAttendanceService,
    CreateHolidayService,
    ListHolidaysService,
    UpdateHolidayService,
    DeleteHolidayService,
    GetLeavePolicyService,
    UpdateLeavePolicyService,
    GetLeaveBalanceService,
    CreateLeaveRequestService,
    ListLeaveRequestsService,
    ReviewLeaveRequestService,
    CancelLeaveRequestService,
    UploadLeaveDocumentService,
    GetLeaveDocumentService,
    CreateShiftService,
    ListShiftsService,
    UpdateShiftService,
    DeleteShiftService,
    AssignShiftService,
    RemoveShiftAssignmentService,
    ListRosterService,
    CreateExpenseService,
    ListExpensesService,
    ReviewExpenseService,
    MarkExpenseReimbursedService,
    DeleteExpenseService,
    UploadExpenseReceiptService,
    GetExpenseReceiptService,
    SetSalaryStructureService,
    ListSalaryStructuresService,
    GeneratePayrollRunService,
    ListPayrollRunsService,
    GetPayrollRunService,
    FinalizePayrollRunService,
    MarkPayrollRunPaidService,
    DeletePayrollRunService,
    SeedPayrollDemoDataService,
    GetTaxSlabsService,
    SetTaxSlabsService,
    ComputeTaxService,
    EstimateTaxService,
    CreateNoticeService,
    ListNoticesService,
    UpdateNoticeService,
    DeleteNoticeService,
    GetHrOverviewReportService,
    GetMyEmployeeService,
    InviteEmployeeSelfServiceService,
    JwtAuthGuard,
    PermissionsGuard,
  ],
  exports: [ListEmployeesService, GetEmployeeService, SeedPayrollDemoDataService],
})
export class HrmModule {}
