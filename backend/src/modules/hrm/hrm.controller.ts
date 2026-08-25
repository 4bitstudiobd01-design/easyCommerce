import {
  Controller,
  Get,
  Post,
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
  @RequirePermissions('hr:leave:manage', 'hr:leave:self')
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
  @RequirePermissions('hr:leave:manage', 'hr:leave:self')
  @ApiOperation({ summary: 'File a leave request' })
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
  @RequirePermissions('hr:leave:manage', 'hr:leave:self')
  @ApiOperation({ summary: 'List leave requests (filterable by employee/status/type)' })
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
  @RequirePermissions('hr:leave:manage', 'hr:leave:self')
  @ApiOperation({ summary: 'Cancel a pending leave request' })
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
  @RequirePermissions('hr:leave:manage', 'hr:leave:self')
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
  @RequirePermissions('hr:leave:manage', 'hr:leave:self')
  @ApiOperation({ summary: 'Download a leave request\'s attached document (authenticated — never a public URL)' })
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
}
