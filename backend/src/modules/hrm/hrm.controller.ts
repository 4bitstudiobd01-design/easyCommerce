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
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/create-employee.dto';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto';

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
}
