import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';
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
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/create-employee.dto';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto';
import { CheckInDto, CheckOutDto, MarkAttendanceStatusDto, ListAttendanceQueryDto } from './dto/attendance.dto';
import { CreateHolidayService } from './services/create-holiday.service';
import { ListHolidaysService } from './services/list-holidays.service';
import { UpdateHolidayService } from './services/update-holiday.service';
import { DeleteHolidayService } from './services/delete-holiday.service';
import { CreateHolidayDto, UpdateHolidayDto, ListHolidaysQueryDto } from './dto/holiday.dto';
import { GetLeavePolicyService } from './services/get-leave-policy.service';
import { UpdateLeavePolicyService } from './services/update-leave-policy.service';
import { UpdateLeavePolicyDto } from './dto/leave-policy.dto';
import { GetLeaveBalanceService } from './services/get-leave-balance.service';
import { CreateLeaveRequestService } from './services/create-leave-request.service';
import { ListLeaveRequestsService } from './services/list-leave-requests.service';
import { ReviewLeaveRequestService } from './services/review-leave-request.service';
import { CancelLeaveRequestService } from './services/cancel-leave-request.service';
import { UploadLeaveDocumentService } from './services/upload-leave-document.service';
import { GetLeaveDocumentService } from './services/get-leave-document.service';
import {
  CreateLeaveRequestDto,
  ReviewLeaveRequestDto,
  ListLeaveRequestsQueryDto,
} from './dto/leave-request.dto';
import { CreateShiftService } from './services/create-shift.service';
import { ListShiftsService } from './services/list-shifts.service';
import { UpdateShiftService } from './services/update-shift.service';
import { DeleteShiftService } from './services/delete-shift.service';
import { AssignShiftService } from './services/assign-shift.service';
import { RemoveShiftAssignmentService } from './services/remove-shift-assignment.service';
import { ListRosterService } from './services/list-roster.service';
import { CreateShiftDto, UpdateShiftDto } from './dto/shift.dto';
import { ListRosterQueryDto, AssignShiftDto, RemoveShiftAssignmentQueryDto } from './dto/roster.dto';
import { CreateExpenseService } from './services/create-expense.service';
import { ListExpensesService } from './services/list-expenses.service';
import { ReviewExpenseService } from './services/review-expense.service';
import { MarkExpenseReimbursedService } from './services/mark-expense-reimbursed.service';
import { DeleteExpenseService } from './services/delete-expense.service';
import { UploadExpenseReceiptService } from './services/upload-expense-receipt.service';
import { GetExpenseReceiptService } from './services/get-expense-receipt.service';
import { CreateExpenseDto, ReviewExpenseDto, ListExpensesQueryDto } from './dto/expense.dto';
import { SetSalaryStructureService } from './services/set-salary-structure.service';
import { ListSalaryStructuresService } from './services/list-salary-structures.service';
import { GeneratePayrollRunService } from './services/generate-payroll-run.service';
import { ListPayrollRunsService } from './services/list-payroll-runs.service';
import { GetPayrollRunService } from './services/get-payroll-run.service';
import { FinalizePayrollRunService } from './services/finalize-payroll-run.service';
import { MarkPayrollRunPaidService } from './services/mark-payroll-run-paid.service';
import { DeletePayrollRunService } from './services/delete-payroll-run.service';
import { SeedPayrollDemoDataService } from './services/seed-payroll-demo-data.service';
import { SetSalaryStructureDto, GeneratePayrollRunDto, ListPayrollRunsQueryDto } from './dto/payroll.dto';
import { SeedPayrollDemoDataResponseDto } from './dto/seed-payroll-demo-data-response.dto';
import { GetAttendanceDeductionPolicyService } from './services/get-attendance-deduction-policy.service';
import { UpdateAttendanceDeductionPolicyService } from './services/update-attendance-deduction-policy.service';
import { UpdateAttendanceDeductionPolicyDto } from './dto/attendance-deduction-policy.dto';
import { GetTaxSlabsService } from './services/get-tax-slabs.service';
import { SetTaxSlabsService } from './services/set-tax-slabs.service';
import { EstimateTaxService } from './services/estimate-tax.service';
import { SetTaxSlabsDto, GetTaxSlabsQueryDto, EstimateTaxQueryDto } from './dto/tax.dto';
import { CreateNoticeService } from './services/create-notice.service';
import { ListNoticesService } from './services/list-notices.service';
import { UpdateNoticeService } from './services/update-notice.service';
import { DeleteNoticeService } from './services/delete-notice.service';
import { CreateNoticeDto, UpdateNoticeDto, ListNoticesQueryDto } from './dto/notice.dto';
import { GetHrOverviewReportService } from './services/get-hr-overview-report.service';
import { GetMyEmployeeService } from './services/get-my-employee.service';
import { InviteEmployeeSelfServiceService } from './services/invite-employee-self-service.service';
import { CreateMyLeaveRequestDto } from './dto/self-service.dto';
import { CreateJobPostingService } from './services/create-job-posting.service';
import { ListJobPostingsService } from './services/list-job-postings.service';
import { UpdateJobPostingService } from './services/update-job-posting.service';
import { CreateCandidateService } from './services/create-candidate.service';
import { ListCandidatesService } from './services/list-candidates.service';
import { UpdateCandidateStageService } from './services/update-candidate-stage.service';
import { DeleteCandidateService } from './services/delete-candidate.service';
import { ScheduleInterviewService } from './services/schedule-interview.service';
import { ListInterviewsService } from './services/list-interviews.service';
import { UpdateInterviewService } from './services/update-interview.service';
import { GetRecruitmentStatsService } from './services/get-recruitment-stats.service';
import {
  CreateJobPostingDto,
  UpdateJobPostingDto,
  CreateCandidateDto,
  UpdateCandidateStageDto,
  ScheduleInterviewDto,
  UpdateInterviewDto,
  ListJobPostingsQueryDto,
  ListCandidatesQueryDto,
  ListInterviewsQueryDto,
} from './dto/recruitment.dto';

@ApiTags('HR — Employees & Departments')
@Controller('hr')
export class HrmController {
  constructor(
    private readonly findStoreByUserService: FindStoreByUserService,
    private readonly createDepartmentService: CreateDepartmentService,
    private readonly listDepartmentsService: ListDepartmentsService,
    private readonly updateDepartmentService: UpdateDepartmentService,
    private readonly deleteDepartmentService: DeleteDepartmentService,
    private readonly createEmployeeService: CreateEmployeeService,
    private readonly listEmployeesService: ListEmployeesService,
    private readonly getEmployeeService: GetEmployeeService,
    private readonly updateEmployeeService: UpdateEmployeeService,
    private readonly terminateEmployeeService: TerminateEmployeeService,
    private readonly checkInService: CheckInService,
    private readonly checkOutService: CheckOutService,
    private readonly markAttendanceStatusService: MarkAttendanceStatusService,
    private readonly listAttendanceService: ListAttendanceService,
    private readonly createHolidayService: CreateHolidayService,
    private readonly listHolidaysService: ListHolidaysService,
    private readonly updateHolidayService: UpdateHolidayService,
    private readonly deleteHolidayService: DeleteHolidayService,
    private readonly getLeavePolicyService: GetLeavePolicyService,
    private readonly updateLeavePolicyService: UpdateLeavePolicyService,
    private readonly getLeaveBalanceService: GetLeaveBalanceService,
    private readonly createLeaveRequestService: CreateLeaveRequestService,
    private readonly listLeaveRequestsService: ListLeaveRequestsService,
    private readonly reviewLeaveRequestService: ReviewLeaveRequestService,
    private readonly cancelLeaveRequestService: CancelLeaveRequestService,
    private readonly uploadLeaveDocumentService: UploadLeaveDocumentService,
    private readonly getLeaveDocumentService: GetLeaveDocumentService,
    private readonly createShiftService: CreateShiftService,
    private readonly listShiftsService: ListShiftsService,
    private readonly updateShiftService: UpdateShiftService,
    private readonly deleteShiftService: DeleteShiftService,
    private readonly assignShiftService: AssignShiftService,
    private readonly removeShiftAssignmentService: RemoveShiftAssignmentService,
    private readonly listRosterService: ListRosterService,
    private readonly createExpenseService: CreateExpenseService,
    private readonly listExpensesService: ListExpensesService,
    private readonly reviewExpenseService: ReviewExpenseService,
    private readonly markExpenseReimbursedService: MarkExpenseReimbursedService,
    private readonly deleteExpenseService: DeleteExpenseService,
    private readonly uploadExpenseReceiptService: UploadExpenseReceiptService,
    private readonly getExpenseReceiptService: GetExpenseReceiptService,
    private readonly setSalaryStructureService: SetSalaryStructureService,
    private readonly listSalaryStructuresService: ListSalaryStructuresService,
    private readonly generatePayrollRunService: GeneratePayrollRunService,
    private readonly listPayrollRunsService: ListPayrollRunsService,
    private readonly getPayrollRunService: GetPayrollRunService,
    private readonly finalizePayrollRunService: FinalizePayrollRunService,
    private readonly markPayrollRunPaidService: MarkPayrollRunPaidService,
    private readonly deletePayrollRunService: DeletePayrollRunService,
    private readonly seedPayrollDemoDataService: SeedPayrollDemoDataService,
    private readonly getAttendanceDeductionPolicyService: GetAttendanceDeductionPolicyService,
    private readonly updateAttendanceDeductionPolicyService: UpdateAttendanceDeductionPolicyService,
    private readonly getTaxSlabsService: GetTaxSlabsService,
    private readonly setTaxSlabsService: SetTaxSlabsService,
    private readonly estimateTaxService: EstimateTaxService,
    private readonly createNoticeService: CreateNoticeService,
    private readonly listNoticesService: ListNoticesService,
    private readonly updateNoticeService: UpdateNoticeService,
    private readonly deleteNoticeService: DeleteNoticeService,
    private readonly getHrOverviewReportService: GetHrOverviewReportService,
    private readonly getMyEmployeeService: GetMyEmployeeService,
    private readonly inviteEmployeeSelfServiceService: InviteEmployeeSelfServiceService,
    private readonly createJobPostingService: CreateJobPostingService,
    private readonly listJobPostingsService: ListJobPostingsService,
    private readonly updateJobPostingService: UpdateJobPostingService,
    private readonly createCandidateService: CreateCandidateService,
    private readonly listCandidatesService: ListCandidatesService,
    private readonly updateCandidateStageService: UpdateCandidateStageService,
    private readonly deleteCandidateService: DeleteCandidateService,
    private readonly scheduleInterviewService: ScheduleInterviewService,
    private readonly listInterviewsService: ListInterviewsService,
    private readonly updateInterviewService: UpdateInterviewService,
    private readonly getRecruitmentStatsService: GetRecruitmentStatsService,
  ) {}

  private async getStoreContext(userId: string, storeIdHeader?: string) {
    const store = await this.findStoreByUserService.execute(userId, storeIdHeader);
    if (!store) {
      throw new BadRequestException('Merchant store context not found.');
    }
    return store;
  }

  // ─── Departments ────────────────────────────────────────────────

  @Post('departments')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:employees:manage')
  @ApiOperation({ summary: 'Create a department' })
  @ApiResponse({ status: 201, description: 'Department created' })
  async createDepartment(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateDepartmentDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createDepartmentService.execute(store.tenantId, store.id, dto);
  }

  @Get('departments')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:employees:manage', 'hr:employees:read')
  @ApiOperation({ summary: 'List departments for the active store' })
  @ApiResponse({ status: 200, description: 'List of departments' })
  async listDepartments(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listDepartmentsService.execute(store.id);
  }

  @Patch('departments/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:employees:manage')
  @ApiOperation({ summary: 'Update a department' })
  @ApiResponse({ status: 200, description: 'Department updated' })
  async updateDepartment(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') departmentId: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateDepartmentService.execute(store.id, departmentId, dto);
  }

  @Delete('departments/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:employees:manage')
  @ApiOperation({ summary: 'Delete a department (employees are unassigned, not deleted)' })
  @ApiResponse({ status: 200, description: 'Department deleted' })
  async deleteDepartment(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') departmentId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    await this.deleteDepartmentService.execute(store.id, departmentId);
    return { success: true, message: 'Department deleted successfully.' };
  }

  // ─── Employees ──────────────────────────────────────────────────

  @Post('employees')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:employees:manage')
  @ApiOperation({ summary: 'Add a new employee record' })
  @ApiResponse({ status: 201, description: 'Employee created' })
  async createEmployee(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateEmployeeDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createEmployeeService.execute(store.tenantId, store.id, dto);
  }

  @Get('employees')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:employees:manage', 'hr:employees:read')
  @ApiOperation({ summary: 'Paginated, filterable, searchable employee directory' })
  @ApiResponse({ status: 200, description: 'Paginated employee list' })
  async listEmployees(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListEmployeesQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listEmployeesService.execute(store.id, query);
  }

  @Get('employees/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:employees:manage', 'hr:employees:read')
  @ApiOperation({ summary: 'Get a single employee record' })
  @ApiResponse({ status: 200, description: 'Employee details' })
  async getEmployee(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') employeeId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getEmployeeService.execute(store.id, employeeId);
  }

  @Patch('employees/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:employees:manage')
  @ApiOperation({ summary: 'Update an employee record' })
  @ApiResponse({ status: 200, description: 'Employee updated' })
  async updateEmployee(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') employeeId: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateEmployeeService.execute(store.id, employeeId, dto);
  }

  @Delete('employees/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:employees:manage')
  @ApiOperation({ summary: 'Terminate an employee (record is kept, not deleted)' })
  @ApiResponse({ status: 200, description: 'Employee terminated' })
  async terminateEmployee(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') employeeId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.terminateEmployeeService.execute(store.id, employeeId);
  }

  @Post('employees/:id/invite-self-service')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:employees:manage')
  @ApiOperation({ summary: "Invite an employee to self-service (creates a staff invite with hr:leave:self, reusing the existing staff invitation system)" })
  @ApiResponse({ status: 201, description: 'Self-service invite created' })
  async inviteEmployeeSelfService(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') employeeId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.inviteEmployeeSelfServiceService.execute(store.tenantId, store.id, userId, employeeId);
  }

  // ─── Attendance ─────────────────────────────────────────────────

  @Get('attendance')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:attendance:manage')
  @ApiOperation({ summary: "List every active employee with their attendance record for a date (today if omitted)" })
  @ApiResponse({ status: 200, description: 'Employee + attendance roster for the date' })
  async listAttendance(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListAttendanceQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listAttendanceService.execute(store.id, query);
  }

  @Post('attendance/check-in')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:attendance:manage')
  @ApiOperation({ summary: 'Check an employee in for a given date' })
  @ApiResponse({ status: 201, description: 'Checked in' })
  async checkIn(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CheckInDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.checkInService.execute(store.tenantId, store.id, userId, dto);
  }

  @Post('attendance/check-out')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:attendance:manage')
  @ApiOperation({ summary: 'Check an employee out for a given date' })
  @ApiResponse({ status: 200, description: 'Checked out' })
  async checkOut(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CheckOutDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.checkOutService.execute(store.id, userId, dto);
  }

  @Post('attendance/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:attendance:manage')
  @ApiOperation({ summary: 'Directly set a day\'s attendance status (Absent/On Leave/Half Day/etc.), no check-in required' })
  @ApiResponse({ status: 201, description: 'Attendance status set' })
  async markAttendanceStatus(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: MarkAttendanceStatusDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.markAttendanceStatusService.execute(store.tenantId, store.id, userId, dto);
  }

  // ─── Holidays ───────────────────────────────────────────────────

  @Post('holidays')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:leave:manage')
  @ApiOperation({ summary: 'Add a company holiday' })
  @ApiResponse({ status: 201, description: 'Holiday created' })
  async createHoliday(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateHolidayDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createHolidayService.execute(store.tenantId, store.id, dto);
  }

  @Get('holidays')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:leave:manage', 'hr:leave:self', 'hr:employees:read', 'hr:employees:manage')
  @ApiOperation({ summary: 'List holidays for a year (current year if omitted)' })
  @ApiResponse({ status: 200, description: 'List of holidays' })
  async listHolidays(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListHolidaysQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listHolidaysService.execute(store.id, query);
  }

  @Patch('holidays/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:leave:manage')
  @ApiOperation({ summary: 'Update a holiday' })
  @ApiResponse({ status: 200, description: 'Holiday updated' })
  async updateHoliday(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') holidayId: string,
    @Body() dto: UpdateHolidayDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateHolidayService.execute(store.id, holidayId, dto);
  }

  @Delete('holidays/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:leave:manage')
  @ApiOperation({ summary: 'Delete a holiday' })
  @ApiResponse({ status: 200, description: 'Holiday deleted' })
  async deleteHoliday(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') holidayId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    await this.deleteHolidayService.execute(store.id, holidayId);
    return { success: true, message: 'Holiday deleted successfully.' };
  }

  // ─── Leave Policy ───────────────────────────────────────────────

  @Get('leave/policy')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:leave:manage')
  @ApiOperation({ summary: 'Get this store\'s annual leave allocation policy (defaults are created on first read)' })
  @ApiResponse({ status: 200, description: 'Leave policy' })
  async getLeavePolicy(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getLeavePolicyService.execute(store.tenantId, store.id);
  }

  @Patch('leave/policy')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:leave:manage')
  @ApiOperation({ summary: 'Update the annual leave allocation policy' })
  @ApiResponse({ status: 200, description: 'Leave policy updated' })
  async updateLeavePolicy(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: UpdateLeavePolicyDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateLeavePolicyService.execute(store.tenantId, store.id, dto);
  }

  // ─── Leave Requests ─────────────────────────────────────────────

  @Get('employees/:id/leave-balance')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:leave:manage')
  @ApiOperation({ summary: 'Get an employee\'s Earned/Casual/Sick leave balance for a year' })
  @ApiResponse({ status: 200, description: 'Leave balance by type' })
  async getLeaveBalance(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') employeeId: string,
    @Query('year') year?: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getLeaveBalanceService.execute(store.tenantId, store.id, employeeId, year ? Number(year) : undefined);
  }

  @Post('leave-requests')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:leave:manage')
  @ApiOperation({ summary: 'File a leave request on behalf of an employee (HR/manager use — see /hr/me/leave-requests for self-service)' })
  @ApiResponse({ status: 201, description: 'Leave request created' })
  async createLeaveRequest(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createLeaveRequestService.execute(store.tenantId, store.id, userId, dto);
  }

  @Get('leave-requests')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:leave:manage')
  @ApiOperation({ summary: 'List leave requests (filterable by employee/status/type) — HR/manager use' })
  @ApiResponse({ status: 200, description: 'Paginated leave requests' })
  async listLeaveRequests(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListLeaveRequestsQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listLeaveRequestsService.execute(store.id, query);
  }

  @Patch('leave-requests/:id/review')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:leave:manage')
  @ApiOperation({ summary: 'Approve or reject a pending leave request' })
  @ApiResponse({ status: 200, description: 'Leave request reviewed' })
  async reviewLeaveRequest(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') requestId: string,
    @Body() dto: ReviewLeaveRequestDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.reviewLeaveRequestService.execute(store.id, requestId, userId, dto);
  }

  @Post('leave-requests/:id/cancel')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:leave:manage')
  @ApiOperation({ summary: 'Cancel a pending leave request — HR/manager use' })
  @ApiResponse({ status: 200, description: 'Leave request cancelled' })
  async cancelLeaveRequest(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') requestId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.cancelLeaveRequestService.execute(store.id, requestId);
  }

  @Post('leave-requests/:id/document')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:leave:manage')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!/\/(jpg|jpeg|png|webp|pdf)$/i.test(file.mimetype)) {
          return cb(new BadRequestException('Only JPG, PNG, WEBP, or PDF files are accepted.'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Attach a supporting document to a sick leave request' })
  @ApiResponse({ status: 201, description: 'Document attached' })
  async uploadLeaveDocument(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') requestId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.uploadLeaveDocumentService.execute(store.tenantId, store.id, requestId, file);
  }

  @Get('leave-requests/:id/document')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:leave:manage')
  @ApiOperation({ summary: 'Download a leave request\'s attached document (authenticated — never a public URL) — HR/manager use' })
  @ApiResponse({ status: 200, description: 'File stream' })
  async downloadLeaveDocument(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') requestId: string,
    @Res() res: Response,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    const { stream, fileName, mimeType } = await this.getLeaveDocumentService.execute(store.id, requestId);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    stream.pipe(res);
  }

  // ─── Shifts ─────────────────────────────────────────────────────

  @Post('shifts')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:shifts:manage')
  @ApiOperation({ summary: 'Create a shift definition' })
  @ApiResponse({ status: 201, description: 'Shift created' })
  async createShift(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateShiftDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createShiftService.execute(store.tenantId, store.id, dto);
  }

  @Get('shifts')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:shifts:manage')
  @ApiOperation({ summary: 'List shift definitions for the active store' })
  @ApiResponse({ status: 200, description: 'List of shifts' })
  async listShifts(@CurrentUser('sub') userId: string, @Headers('x-store-id') headerStoreId: string) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listShiftsService.execute(store.id);
  }

  @Patch('shifts/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:shifts:manage')
  @ApiOperation({ summary: 'Update a shift definition' })
  @ApiResponse({ status: 200, description: 'Shift updated' })
  async updateShift(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') shiftId: string,
    @Body() dto: UpdateShiftDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateShiftService.execute(store.id, shiftId, dto);
  }

  @Delete('shifts/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:shifts:manage')
  @ApiOperation({ summary: 'Delete a shift definition (blocked while it is used on the roster)' })
  @ApiResponse({ status: 200, description: 'Shift deleted' })
  async deleteShift(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') shiftId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    await this.deleteShiftService.execute(store.id, shiftId);
    return { success: true, message: 'Shift deleted successfully.' };
  }

  // ─── Roster ─────────────────────────────────────────────────────

  @Get('roster')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:shifts:manage')
  @ApiOperation({ summary: 'Get the shift roster grid (employees x shifts) for a date range' })
  @ApiResponse({ status: 200, description: 'Roster employees, shifts, and assignments' })
  async listRoster(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListRosterQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listRosterService.execute(store.id, query);
  }

  @Post('roster/assign')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:shifts:manage')
  @ApiOperation({ summary: 'Assign (or reassign) a shift to an employee for a date' })
  @ApiResponse({ status: 201, description: 'Shift assigned' })
  async assignShift(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: AssignShiftDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.assignShiftService.execute(store.tenantId, store.id, userId, dto);
  }

  @Delete('roster/assign')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:shifts:manage')
  @ApiOperation({ summary: "Clear an employee's roster assignment for a date" })
  @ApiResponse({ status: 200, description: 'Shift assignment removed' })
  async removeShiftAssignment(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: RemoveShiftAssignmentQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    await this.removeShiftAssignmentService.execute(store.id, query.employeeId, query.date);
    return { success: true, message: 'Roster assignment cleared.' };
  }

  // ─── Expenses ───────────────────────────────────────────────────

  @Post('expenses')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:expenses:manage')
  @ApiOperation({ summary: 'File an expense claim for an employee' })
  @ApiResponse({ status: 201, description: 'Expense created' })
  async createExpense(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateExpenseDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createExpenseService.execute(store.tenantId, store.id, userId, dto);
  }

  @Get('expenses')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:expenses:manage')
  @ApiOperation({ summary: 'List expense claims (filterable by employee/status/category)' })
  @ApiResponse({ status: 200, description: 'Paginated expense claims' })
  async listExpenses(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListExpensesQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listExpensesService.execute(store.id, query);
  }

  @Patch('expenses/:id/review')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:expenses:manage')
  @ApiOperation({ summary: 'Approve or reject a pending expense claim' })
  @ApiResponse({ status: 200, description: 'Expense reviewed' })
  async reviewExpense(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') expenseId: string,
    @Body() dto: ReviewExpenseDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.reviewExpenseService.execute(store.id, expenseId, userId, dto);
  }

  @Post('expenses/:id/reimburse')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:expenses:manage')
  @ApiOperation({ summary: 'Mark an approved expense claim as reimbursed' })
  @ApiResponse({ status: 200, description: 'Expense marked reimbursed' })
  async reimburseExpense(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') expenseId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.markExpenseReimbursedService.execute(store.id, expenseId);
  }

  @Delete('expenses/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:expenses:manage')
  @ApiOperation({ summary: 'Delete a pending expense claim' })
  @ApiResponse({ status: 200, description: 'Expense deleted' })
  async deleteExpense(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') expenseId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    await this.deleteExpenseService.execute(store.id, expenseId);
    return { success: true, message: 'Expense deleted successfully.' };
  }

  @Post('expenses/:id/receipt')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:expenses:manage')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!/\/(jpg|jpeg|png|webp|pdf)$/i.test(file.mimetype)) {
          return cb(new BadRequestException('Only JPG, PNG, WEBP, or PDF files are accepted.'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Attach a receipt to an expense claim' })
  @ApiResponse({ status: 201, description: 'Receipt attached' })
  async uploadExpenseReceipt(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') expenseId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.uploadExpenseReceiptService.execute(store.tenantId, store.id, expenseId, file);
  }

  @Get('expenses/:id/receipt')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:expenses:manage')
  @ApiOperation({ summary: "Download an expense claim's attached receipt (authenticated — never a public URL)" })
  @ApiResponse({ status: 200, description: 'File stream' })
  async downloadExpenseReceipt(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') expenseId: string,
    @Res() res: Response,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    const { stream, fileName, mimeType } = await this.getExpenseReceiptService.execute(store.id, expenseId);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    stream.pipe(res);
  }

  // ─── Payroll ────────────────────────────────────────────────────

  @Get('payroll/salary-structures')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:payroll:manage')
  @ApiOperation({ summary: 'List active employees with their current salary structure (if set)' })
  @ApiResponse({ status: 200, description: 'Employee + salary structure rows' })
  async listSalaryStructures(@CurrentUser('sub') userId: string, @Headers('x-store-id') headerStoreId: string) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listSalaryStructuresService.execute(store.tenantId, store.id, userId);
  }

  @Put('payroll/salary-structures/:employeeId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:payroll:manage')
  @ApiOperation({ summary: "Set an employee's salary structure (creates or overwrites)" })
  @ApiResponse({ status: 200, description: 'Salary structure saved' })
  async setSalaryStructure(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: SetSalaryStructureDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.setSalaryStructureService.execute(store.tenantId, store.id, employeeId, dto);
  }

  @Post('payroll/seed-demo-data')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:payroll:manage')
  @ApiOperation({ summary: 'Seed realistic demo payroll runs, payslips, employees, and salary structures' })
  @ApiResponse({ status: 200, description: 'Payroll demo data seeded', type: SeedPayrollDemoDataResponseDto })
  async seedPayrollDemoData(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ): Promise<SeedPayrollDemoDataResponseDto> {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.seedPayrollDemoDataService.execute(store.tenantId, store.id, userId);
  }

  @Get('payroll/attendance-deduction-policy')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:payroll:manage')
  @ApiOperation({ summary: "Get this store's attendance/leave-based salary deduction policy (lazily created with defaults)" })
  @ApiResponse({ status: 200, description: 'Attendance deduction policy' })
  async getAttendanceDeductionPolicy(@CurrentUser('sub') userId: string, @Headers('x-store-id') headerStoreId: string) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getAttendanceDeductionPolicyService.execute(store.tenantId, store.id);
  }

  @Put('payroll/attendance-deduction-policy')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:payroll:manage')
  @ApiOperation({ summary: "Update this store's attendance/leave-based salary deduction policy" })
  @ApiResponse({ status: 200, description: 'Attendance deduction policy updated' })
  async updateAttendanceDeductionPolicy(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: UpdateAttendanceDeductionPolicyDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateAttendanceDeductionPolicyService.execute(store.tenantId, store.id, dto);
  }

  @Post('payroll/runs')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:payroll:manage')
  @ApiOperation({ summary: 'Generate a draft payroll run for a month, one payslip per active employee with a salary structure' })
  @ApiResponse({ status: 201, description: 'Payroll run generated' })
  async generatePayrollRun(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: GeneratePayrollRunDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.generatePayrollRunService.execute(store.tenantId, store.id, userId, dto);
  }

  @Get('payroll/runs')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:payroll:manage')
  @ApiOperation({ summary: 'List payroll runs, most recent first' })
  @ApiResponse({ status: 200, description: 'List of payroll runs' })
  async listPayrollRuns(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListPayrollRunsQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listPayrollRunsService.execute(store.tenantId, store.id, query, userId);
  }

  @Get('payroll/runs/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:payroll:manage')
  @ApiOperation({ summary: 'Get a payroll run with its payslips' })
  @ApiResponse({ status: 200, description: 'Payroll run detail' })
  async getPayrollRun(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') runId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getPayrollRunService.execute(store.id, runId);
  }

  @Post('payroll/runs/:id/finalize')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:payroll:manage')
  @ApiOperation({ summary: 'Finalize a draft payroll run, locking its payslips' })
  @ApiResponse({ status: 200, description: 'Payroll run finalized' })
  async finalizePayrollRun(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') runId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.finalizePayrollRunService.execute(store.id, runId, userId);
  }

  @Post('payroll/runs/:id/mark-paid')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:payroll:manage')
  @ApiOperation({ summary: 'Mark a finalized payroll run as paid' })
  @ApiResponse({ status: 200, description: 'Payroll run marked paid' })
  async markPayrollRunPaid(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') runId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.markPayrollRunPaidService.execute(store.id, runId);
  }

  @Delete('payroll/runs/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:payroll:manage')
  @ApiOperation({ summary: 'Delete a draft payroll run' })
  @ApiResponse({ status: 200, description: 'Payroll run deleted' })
  async deletePayrollRun(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') runId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    await this.deletePayrollRunService.execute(store.id, runId);
    return { success: true, message: 'Payroll run deleted successfully.' };
  }

  // ─── Tax ────────────────────────────────────────────────────────

  @Get('tax/slabs')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:payroll:manage')
  @ApiOperation({ summary: "Get this store's tax slabs for a fiscal year (accountant-configured, not pre-filled)" })
  @ApiResponse({ status: 200, description: 'List of tax slabs' })
  async getTaxSlabs(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: GetTaxSlabsQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getTaxSlabsService.execute(store.id, query.fiscalYear);
  }

  @Put('tax/slabs')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:payroll:manage')
  @ApiOperation({ summary: 'Replace this store\'s tax slabs for a fiscal year' })
  @ApiResponse({ status: 200, description: 'Tax slabs saved' })
  async setTaxSlabs(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: SetTaxSlabsDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.setTaxSlabsService.execute(store.tenantId, store.id, dto);
  }

  @Get('tax/estimate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:payroll:manage')
  @ApiOperation({ summary: 'Preview the tax computed for a given annual income under the configured slabs' })
  @ApiResponse({ status: 200, description: 'Tax computation breakdown' })
  async estimateTax(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: EstimateTaxQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.estimateTaxService.execute(store.id, query);
  }

  // ─── Notice Board ───────────────────────────────────────────────

  @Get('notices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active notices — visible to every authenticated dashboard user, no specific permission required' })
  @ApiResponse({ status: 200, description: 'List of notices' })
  async listNotices(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListNoticesQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listNoticesService.execute(store.id, query);
  }

  @Post('notices')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:notices:manage')
  @ApiOperation({ summary: 'Post a notice to the company notice board' })
  @ApiResponse({ status: 201, description: 'Notice created' })
  async createNotice(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateNoticeDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createNoticeService.execute(store.tenantId, store.id, userId, dto);
  }

  @Patch('notices/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:notices:manage')
  @ApiOperation({ summary: 'Update a notice' })
  @ApiResponse({ status: 200, description: 'Notice updated' })
  async updateNotice(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') noticeId: string,
    @Body() dto: UpdateNoticeDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateNoticeService.execute(store.id, noticeId, dto);
  }

  @Delete('notices/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:notices:manage')
  @ApiOperation({ summary: 'Delete a notice' })
  @ApiResponse({ status: 200, description: 'Notice deleted' })
  async deleteNotice(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') noticeId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    await this.deleteNoticeService.execute(store.id, noticeId);
    return { success: true, message: 'Notice deleted successfully.' };
  }

  // ─── Recruitment ────────────────────────────────────────────────

  @Post('recruitment/job-postings')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:recruitment:manage')
  @ApiOperation({ summary: 'Create a job posting' })
  @ApiResponse({ status: 201, description: 'Job posting created' })
  async createJobPosting(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateJobPostingDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createJobPostingService.execute(store.tenantId, store.id, dto);
  }

  @Get('recruitment/job-postings')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:recruitment:manage')
  @ApiOperation({ summary: 'List job postings for the active store' })
  @ApiResponse({ status: 200, description: 'List of job postings' })
  async listJobPostings(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListJobPostingsQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listJobPostingsService.execute(store.id, query);
  }

  @Patch('recruitment/job-postings/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:recruitment:manage')
  @ApiOperation({ summary: 'Update a job posting (status, details, or close it)' })
  @ApiResponse({ status: 200, description: 'Job posting updated' })
  async updateJobPosting(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') jobPostingId: string,
    @Body() dto: UpdateJobPostingDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateJobPostingService.execute(store.id, jobPostingId, dto);
  }

  @Post('recruitment/candidates')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:recruitment:manage')
  @ApiOperation({ summary: 'Add a candidate to a job posting pipeline' })
  @ApiResponse({ status: 201, description: 'Candidate created' })
  async createCandidate(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateCandidateDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createCandidateService.execute(store.tenantId, store.id, dto);
  }

  @Get('recruitment/candidates')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:recruitment:manage')
  @ApiOperation({ summary: 'List candidates, optionally filtered by job posting or stage' })
  @ApiResponse({ status: 200, description: 'List of candidates' })
  async listCandidates(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListCandidatesQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listCandidatesService.execute(store.id, query);
  }

  @Patch('recruitment/candidates/:id/stage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:recruitment:manage')
  @ApiOperation({ summary: 'Move a candidate to a new pipeline stage' })
  @ApiResponse({ status: 200, description: 'Candidate stage updated' })
  async updateCandidateStage(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') candidateId: string,
    @Body() dto: UpdateCandidateStageDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateCandidateStageService.execute(store.id, candidateId, dto);
  }

  @Delete('recruitment/candidates/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:recruitment:manage')
  @ApiOperation({ summary: 'Remove a candidate' })
  @ApiResponse({ status: 200, description: 'Candidate deleted' })
  async deleteCandidate(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') candidateId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.deleteCandidateService.execute(store.id, candidateId);
  }

  @Post('recruitment/interviews')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:recruitment:manage')
  @ApiOperation({ summary: 'Schedule an interview for a candidate' })
  @ApiResponse({ status: 201, description: 'Interview scheduled' })
  async scheduleInterview(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: ScheduleInterviewDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.scheduleInterviewService.execute(store.tenantId, store.id, dto);
  }

  @Get('recruitment/interviews')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:recruitment:manage')
  @ApiOperation({ summary: 'List interviews, optionally only upcoming scheduled ones' })
  @ApiResponse({ status: 200, description: 'List of interviews' })
  async listInterviews(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListInterviewsQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listInterviewsService.execute(store.id, query);
  }

  @Patch('recruitment/interviews/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:recruitment:manage')
  @ApiOperation({ summary: 'Update, reschedule, cancel, or add feedback to an interview' })
  @ApiResponse({ status: 200, description: 'Interview updated' })
  async updateInterview(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') interviewId: string,
    @Body() dto: UpdateInterviewDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateInterviewService.execute(store.id, interviewId, dto);
  }

  @Get('recruitment/stats')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:recruitment:manage')
  @ApiOperation({ summary: 'Recruitment funnel stats: applicants, hires, avg days-to-hire, stage breakdown' })
  @ApiResponse({ status: 200, description: 'Recruitment stats' })
  async getRecruitmentStats(@CurrentUser('sub') userId: string, @Headers('x-store-id') headerStoreId: string) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getRecruitmentStatsService.execute(store.id);
  }

  // ─── Reports ────────────────────────────────────────────────────

  @Get('reports/overview')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions(
    'hr:employees:manage',
    'hr:employees:read',
    'hr:attendance:manage',
    'hr:leave:manage',
    'hr:payroll:manage',
    'hr:expenses:manage',
    'hr:recruitment:manage',
  )
  @ApiOperation({ summary: 'HR overview: headcount, today\'s attendance, leave, payroll, and expense summaries' })
  @ApiResponse({ status: 200, description: 'HR overview report' })
  async getHrOverviewReport(@CurrentUser('sub') userId: string, @Headers('x-store-id') headerStoreId: string) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getHrOverviewReportService.execute(store.id);
  }

  // ─── Self-Service ("My ...") ──────────────────────────────────────
  // Every endpoint here resolves the acting employee from the logged-in user's own
  // session (GetMyEmployeeService) — never from a client-supplied employeeId — so an
  // hr:leave:self holder can only ever see or touch their own data.

  @Get('me/employee')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:leave:self', 'hr:leave:manage')
  @ApiOperation({ summary: 'Get the HR employee record linked to the logged-in self-service user' })
  @ApiResponse({ status: 200, description: 'My employee record' })
  async getMyEmployee(@CurrentUser('sub') userId: string, @Headers('x-store-id') headerStoreId: string) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getMyEmployeeService.execute(store.id, userId);
  }

  @Get('me/leave-balance')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:leave:self', 'hr:leave:manage')
  @ApiOperation({ summary: 'Get my own Earned/Casual/Sick leave balance for a year' })
  @ApiResponse({ status: 200, description: 'My leave balance by type' })
  async getMyLeaveBalance(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query('year') year?: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    const me = await this.getMyEmployeeService.execute(store.id, userId);
    return this.getLeaveBalanceService.execute(store.tenantId, store.id, me.id, year ? Number(year) : undefined);
  }

  @Post('me/leave-requests')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:leave:self', 'hr:leave:manage')
  @ApiOperation({ summary: 'File a leave request for myself' })
  @ApiResponse({ status: 201, description: 'Leave request created' })
  async createMyLeaveRequest(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateMyLeaveRequestDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    const me = await this.getMyEmployeeService.execute(store.id, userId);
    return this.createLeaveRequestService.execute(store.tenantId, store.id, userId, { ...dto, employeeId: me.id });
  }

  @Get('me/leave-requests')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:leave:self', 'hr:leave:manage')
  @ApiOperation({ summary: 'List my own leave requests' })
  @ApiResponse({ status: 200, description: 'My paginated leave requests' })
  async listMyLeaveRequests(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListLeaveRequestsQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    const me = await this.getMyEmployeeService.execute(store.id, userId);
    return this.listLeaveRequestsService.execute(store.id, { ...query, employeeId: me.id });
  }

  @Post('me/leave-requests/:id/cancel')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:leave:self', 'hr:leave:manage')
  @ApiOperation({ summary: 'Cancel one of my own pending leave requests' })
  @ApiResponse({ status: 200, description: 'Leave request cancelled' })
  async cancelMyLeaveRequest(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') requestId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    const me = await this.getMyEmployeeService.execute(store.id, userId);
    return this.cancelLeaveRequestService.execute(store.id, requestId, me.id);
  }

  @Post('me/leave-requests/:id/document')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:leave:self', 'hr:leave:manage')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!/\/(jpg|jpeg|png|webp|pdf)$/i.test(file.mimetype)) {
          return cb(new BadRequestException('Only JPG, PNG, WEBP, or PDF files are accepted.'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Attach a supporting document to one of my own sick leave requests' })
  @ApiResponse({ status: 201, description: 'Document attached' })
  async uploadMyLeaveDocument(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') requestId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    const me = await this.getMyEmployeeService.execute(store.id, userId);
    return this.uploadLeaveDocumentService.execute(store.tenantId, store.id, requestId, file, me.id);
  }

  @Get('me/leave-requests/:id/document')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('hr:leave:self', 'hr:leave:manage')
  @ApiOperation({ summary: "Download the document attached to one of my own leave requests" })
  @ApiResponse({ status: 200, description: 'File stream' })
  async downloadMyLeaveDocument(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') requestId: string,
    @Res() res: Response,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    const me = await this.getMyEmployeeService.execute(store.id, userId);
    const { stream, fileName, mimeType } = await this.getLeaveDocumentService.execute(store.id, requestId, me.id);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    stream.pipe(res);
  }
}
