import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRoleEnum } from '../user/entities/user.entity';
import { DashboardFacadeService } from './services/dashboard-facade.service';
import {
  DashboardSummaryQueryDto,
  DashboardAnalyticsQueryDto,
  DashboardOperationsQueryDto,
} from './dto/dashboard-query.dto';

@ApiTags('Super Admin Dashboard Control Center')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleEnum.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminDashboardController {
  constructor(private readonly dashboardFacadeService: DashboardFacadeService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get Platform KPIs, Merchant Summary, Store Directory counts and Orders Velocity' })
  @ApiResponse({ status: 200, description: 'Summary KPI snapshot payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getSummary(@Query() query: DashboardSummaryQueryDto) {
    const data = await this.dashboardFacadeService.getSummary(query);
    return {
      statusCode: 200,
      success: true,
      timestamp: new Date().toISOString(),
      data,
    };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get Recharts time-series data (Revenue trend, Merchant growth, Orders trend, Plans share)' })
  @ApiResponse({ status: 200, description: 'Analytics charts payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAnalytics(@Query() query: DashboardAnalyticsQueryDto) {
    const data = await this.dashboardFacadeService.getAnalytics(query);
    return {
      statusCode: 200,
      success: true,
      timestamp: new Date().toISOString(),
      data,
    };
  }

  @Get('operations')
  @ApiOperation({ summary: 'Get live activities, system notifications, top merchants and top products' })
  @ApiResponse({ status: 200, description: 'Operations stream payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getOperations(@Query() query: DashboardOperationsQueryDto) {
    const data = await this.dashboardFacadeService.getOperations(query);
    return {
      statusCode: 200,
      success: true,
      timestamp: new Date().toISOString(),
      data,
    };
  }

  @Get('infrastructure')
  @ApiOperation({ summary: 'Get microservices health telemetry (API Gateway, PostgreSQL, Redis, Queues, S3)' })
  @ApiResponse({ status: 200, description: 'Infrastructure telemetry payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getInfrastructure() {
    const data = await this.dashboardFacadeService.getInfrastructure();
    return {
      statusCode: 200,
      success: true,
      timestamp: new Date().toISOString(),
      data,
    };
  }
}
