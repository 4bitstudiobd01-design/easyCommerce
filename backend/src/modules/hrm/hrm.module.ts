import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DepartmentEntity } from './entities/department.entity';
import { EmployeeEntity } from './entities/employee.entity';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([DepartmentEntity, EmployeeEntity]),
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
    JwtAuthGuard,
    PermissionsGuard,
  ],
  exports: [ListEmployeesService, GetEmployeeService],
})
export class HrmModule {}
