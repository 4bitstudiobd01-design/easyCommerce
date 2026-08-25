import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DepartmentEntity } from './entities/department.entity';
import { EmployeeEntity } from './entities/employee.entity';
import { AttendanceEntity } from './entities/attendance.entity';
import { HolidayEntity } from './entities/holiday.entity';
import { LeavePolicyEntity } from './entities/leave-policy.entity';
import { LeaveRequestEntity } from './entities/leave-request.entity';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DepartmentEntity,
      EmployeeEntity,
      AttendanceEntity,
      HolidayEntity,
      LeavePolicyEntity,
      LeaveRequestEntity,
    ]),
    TenantModule,
    // Provides GetMyPermissionsService, the source of truth PermissionsGuard uses to
    // resolve an owner's/staff member's effective hr:* permissions for this store.
    StaffModule,
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
    JwtAuthGuard,
    PermissionsGuard,
  ],
  exports: [ListEmployeesService, GetEmployeeService],
})
export class HrmModule {}
