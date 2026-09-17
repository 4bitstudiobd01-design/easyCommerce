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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRoleEnum } from '../user/entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';
import { CreateCustomerService } from './services/create-customer.service';
import { ListCustomersService } from './services/list-customers.service';
import { GetCustomerKpiService } from './services/get-customer-kpi.service';
import { FindCustomerByIdService } from './services/find-customer-by-id.service';
import { UpdateCustomerService } from './services/update-customer.service';
import { UpdateCustomerStatusService } from './services/update-customer-status.service';
import { BulkCustomerStatusService } from './services/bulk-customer-status.service';

import { ListCustomerAddressesService } from './services/list-customer-addresses.service';
import { CreateCustomerAddressService } from './services/create-customer-address.service';
import { UpdateCustomerAddressService } from './services/update-customer-address.service';
import { SetDefaultCustomerAddressService } from './services/set-default-customer-address.service';
import { DeleteCustomerAddressService } from './services/delete-customer-address.service';
import { ListCustomerOrdersService } from './services/list-customer-orders.service';

import { ListCustomerNotesService } from './services/list-customer-notes.service';
import { CreateCustomerNoteService } from './services/create-customer-note.service';
import { DeleteCustomerNoteService } from './services/delete-customer-note.service';
import { ListCustomerActivitiesService } from './services/list-customer-activities.service';

import { ExportCustomersService } from './services/export-customers.service';
import { ImportCustomersService } from './services/import-customers.service';
import { GetCustomerAnalyticsService } from './services/get-customer-analytics.service';
import { ManageCustomerSegmentService } from './services/manage-customer-segment.service';
import { FraudCheckService } from './services/fraud-check.service';
import { ListLeadsService } from './services/list-leads.service';
import { CreateLeadService } from './services/create-lead.service';
import { UpdateLeadStageService } from './services/update-lead-stage.service';
import { UpdateLeadDetailsService } from './services/update-lead-details.service';
import { ScheduleLeadFollowUpService } from './services/schedule-lead-follow-up.service';
import { ConvertLeadToCustomerService } from './services/convert-lead-to-customer.service';
import { AddLeadInquiryService } from './services/add-lead-inquiry.service';
import { DeleteLeadInquiryService } from './services/delete-lead-inquiry.service';
import { SeedLeadsService } from './services/seed-leads.service';
import { SeedCustomersService } from './services/seed-customers.service';
import { ListStoreActivitiesService } from './services/list-store-activities.service';
import { RecordCustomerActivityService } from './services/record-customer-activity.service';
import { LogCustomerActivityService } from './services/log-customer-activity.service';

import { AddLeadInquiryDto } from './dto/add-lead-inquiry.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UpdateCustomerStatusDto } from './dto/update-customer-status.dto';
import { CustomerListDto } from './dto/customer-list.dto';
import { CreateCustomerAddressDto } from './dto/create-customer-address.dto';
import { UpdateCustomerAddressDto } from './dto/update-customer-address.dto';
import { CustomerOrderListDto } from './dto/customer-order-list.dto';
import { CreateCustomerNoteDto } from './dto/create-customer-note.dto';
import { LogCustomerActivityDto } from './dto/log-customer-activity.dto';
import { BulkCustomerStatusDto } from './dto/bulk-customer-status.dto';
import { ImportCustomersDto } from './dto/import-customer.dto';
import { CustomerAnalyticsQueryDto } from './dto/customer-analytics.dto';
import { CreateCustomerSegmentDto, UpdateCustomerSegmentDto, SegmentRuleGroupDto } from './dto/customer-segment.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadStageDto, UpdateLeadDetailsDto } from './dto/update-lead.dto';
import { LeadQueryDto } from './dto/lead-query.dto';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomerController {
  constructor(
    private readonly findStoreByUserService: FindStoreByUserService,
    private readonly createCustomerService: CreateCustomerService,
    private readonly listCustomersService: ListCustomersService,
    private readonly getCustomerKpiService: GetCustomerKpiService,
    private readonly findCustomerByIdService: FindCustomerByIdService,
    private readonly updateCustomerService: UpdateCustomerService,
    private readonly updateCustomerStatusService: UpdateCustomerStatusService,
    private readonly bulkCustomerStatusService: BulkCustomerStatusService,
    private readonly listCustomerAddressesService: ListCustomerAddressesService,
    private readonly createCustomerAddressService: CreateCustomerAddressService,
    private readonly updateCustomerAddressService: UpdateCustomerAddressService,
    private readonly setDefaultCustomerAddressService: SetDefaultCustomerAddressService,
    private readonly deleteCustomerAddressService: DeleteCustomerAddressService,
    private readonly listCustomerOrdersService: ListCustomerOrdersService,
    private readonly listCustomerNotesService: ListCustomerNotesService,
    private readonly createCustomerNoteService: CreateCustomerNoteService,
    private readonly deleteCustomerNoteService: DeleteCustomerNoteService,
    private readonly listCustomerActivitiesService: ListCustomerActivitiesService,
    private readonly exportCustomersService: ExportCustomersService,
    private readonly importCustomersService: ImportCustomersService,
    private readonly getCustomerAnalyticsService: GetCustomerAnalyticsService,
    private readonly manageCustomerSegmentService: ManageCustomerSegmentService,
    private readonly fraudCheckService: FraudCheckService,
    private readonly listLeadsService: ListLeadsService,
    private readonly createLeadService: CreateLeadService,
    private readonly updateLeadStageService: UpdateLeadStageService,
    private readonly updateLeadDetailsService: UpdateLeadDetailsService,
    private readonly scheduleLeadFollowUpService: ScheduleLeadFollowUpService,
    private readonly convertLeadToCustomerService: ConvertLeadToCustomerService,
    private readonly addLeadInquiryService: AddLeadInquiryService,
    private readonly deleteLeadInquiryService: DeleteLeadInquiryService,
    private readonly seedLeadsService: SeedLeadsService,
    private readonly seedCustomersService: SeedCustomersService,
    private readonly listStoreActivitiesService: ListStoreActivitiesService,
    private readonly recordCustomerActivityService: RecordCustomerActivityService,
    private readonly logCustomerActivityService: LogCustomerActivityService,
  ) {}

  private async getMerchantTenantContext(userId: string, storeId?: string): Promise<{ tenantId: string; storeId?: string }> {
    const store = await this.findStoreByUserService.execute(userId, storeId);
    if (!store) {
      throw new BadRequestException('Merchant must create a store before managing customers.');
    }
    return { tenantId: store.tenantId, storeId: store.id };
  }

  // --- STORE-WIDE ACTIVITY FEED ENDPOINT ---

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get('activities/all')
  @ApiOperation({ summary: 'Get store-wide activity feed (leads, customers, orders, notes)' })
  async listStoreActivities(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    const items = await this.listStoreActivitiesService.execute(
      ctx.tenantId,
      ctx.storeId,
      limit ? Math.min(parseInt(limit, 10), 100) : 50,
      type,
      search,
    );
    return { success: true, data: items };
  }

  // --- CUSTOMER LISTING ---

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get()
  @ApiOperation({ summary: 'List store customers with server-side pagination, search, segment & filters' })
  @ApiResponse({ status: 200, description: 'Paginated customer list' })
  async listCustomers(
    @CurrentUser('sub') userId: string,
    @Query() dto: CustomerListDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.listCustomersService.execute(ctx.tenantId, dto);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get('kpi')
  @ApiOperation({ summary: 'Get Customer KPI statistics' })
  @ApiResponse({ status: 200, description: 'Customer KPI metrics' })
  async getKpis(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.getCustomerKpiService.execute(ctx.tenantId);
  }

  // --- ANALYTICS ENDPOINTS ---

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get('analytics/overview')
  @ApiOperation({ summary: 'Get detailed Customer Analytics overview metrics' })
  async getAnalyticsOverview(
    @CurrentUser('sub') userId: string,
    @Query() dto: CustomerAnalyticsQueryDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.getCustomerAnalyticsService.getOverview(ctx.tenantId, dto);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get('analytics/full')
  @ApiOperation({ summary: 'Get full CRM analytics (KPIs, RFM, channels, top spenders, leads pipeline) in one request' })
  async getFullAnalytics(
    @CurrentUser('sub') userId: string,
    @Query() dto: CustomerAnalyticsQueryDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    const data = await this.getCustomerAnalyticsService.getFullAnalytics(ctx.tenantId, dto);
    return { success: true, data };
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get('analytics/sources')
  @ApiOperation({ summary: 'Get Customer source distribution breakdown' })
  async getAnalyticsSources(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.getCustomerAnalyticsService.getSourceDistribution(ctx.tenantId);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get('analytics/trend')
  @ApiOperation({ summary: 'Get Customer growth and revenue trend chart data' })
  async getAnalyticsTrend(
    @CurrentUser('sub') userId: string,
    @Query() dto: CustomerAnalyticsQueryDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.getCustomerAnalyticsService.getTrendData(ctx.tenantId, dto);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get('analytics/top')
  @ApiOperation({ summary: 'Get Top Customers ranking by revenue' })
  async getTopCustomers(
    @CurrentUser('sub') userId: string,
    @Query('limit') limitStr?: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    const limit = Math.min(50, Math.max(1, parseInt(limitStr || '10', 10)));
    return this.getCustomerAnalyticsService.getTopCustomers(ctx.tenantId, limit);
  }

  // --- SEGMENT ENDPOINTS ---

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get('segments')
  @ApiOperation({ summary: 'List customer segments for store' })
  async listSegments(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.manageCustomerSegmentService.findAll(ctx.tenantId);
  }

  @Roles(UserRoleEnum.STORE_OWNER)
  @Post('segments/seed')
  @ApiOperation({ summary: 'Seed default starter customer segments for current merchant store' })
  @ApiResponse({ status: 201, description: 'Default segments seeded successfully' })
  async seedSegments(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    await this.manageCustomerSegmentService.seedDefaultSegments(ctx.tenantId);
    return this.manageCustomerSegmentService.findAll(ctx.tenantId);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Post('segments')
  @ApiOperation({ summary: 'Create a new rule-based customer segment' })
  async createSegment(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateCustomerSegmentDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.manageCustomerSegmentService.create(ctx.tenantId, dto, ctx.storeId);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Post('segments/preview')
  @ApiOperation({ summary: 'Preview matching customer count for rule conditions' })
  async previewSegmentRules(
    @CurrentUser('sub') userId: string,
    @Body() rules: SegmentRuleGroupDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.manageCustomerSegmentService.preview(ctx.tenantId, rules as any);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get('segments/:id')
  @ApiOperation({ summary: 'Get segment details by ID' })
  async getSegmentById(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.manageCustomerSegmentService.findById(id, ctx.tenantId);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get('segments/:id/customers')
  @ApiOperation({ summary: 'Get list of real customers matching this segment' })
  async getSegmentCustomers(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.manageCustomerSegmentService.findSegmentCustomers(id, ctx.tenantId);
  }


  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Patch('segments/:id')
  @ApiOperation({ summary: 'Update customer segment rules or details' })
  async updateSegment(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerSegmentDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.manageCustomerSegmentService.update(id, ctx.tenantId, dto);
  }

  @Roles(UserRoleEnum.STORE_OWNER)
  @Delete('segments/:id')
  @ApiOperation({ summary: 'Delete a customer segment definition' })
  async deleteSegment(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.manageCustomerSegmentService.delete(id, ctx.tenantId);
  }

  // --- IMPORT & EXPORT ENDPOINTS ---

  @Roles(UserRoleEnum.STORE_OWNER)
  @Get('export')
  @ApiOperation({ summary: 'Export matching store customers to CSV' })
  async exportCustomers(
    @CurrentUser('sub') userId: string,
    @Query() dto: CustomerListDto,
    @Res() res: Response,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    const stream = await this.exportCustomersService.execute(ctx.tenantId, dto);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="customers-export-${Date.now()}.csv"`);
    stream.pipe(res);
  }

  @Roles(UserRoleEnum.STORE_OWNER)
  @Post('import')
  @ApiOperation({ summary: 'Import customer records from parsed CSV payload' })
  @ApiResponse({ status: 201, description: 'Customer batch import completed successfully' })
  async importCustomers(
    @CurrentUser('sub') userId: string,
    @Body() dto: ImportCustomersDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.importCustomersService.execute(ctx.tenantId, dto, ctx.storeId);
  }

  @Roles(UserRoleEnum.STORE_OWNER)
  @Post('bulk/status')
  @ApiOperation({ summary: 'Bulk update status for selected customers' })
  @ApiResponse({ status: 200, description: 'Bulk customer status updated successfully' })
  async bulkUpdateCustomerStatus(
    @CurrentUser('sub') userId: string,
    @Body() dto: BulkCustomerStatusDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.bulkCustomerStatusService.execute(ctx.tenantId, dto);
  }

  // --- LEADS / CRM PIPELINE ENDPOINTS ---
  // These MUST be defined before @Get(':id') to prevent 'leads' matching :id param

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get('leads')
  @ApiOperation({ summary: 'List sales leads and deals pipeline' })
  @ApiResponse({ status: 200, description: 'List of leads' })
  async listLeads(
    @CurrentUser('sub') userId: string,
    @Query() dto: LeadQueryDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.listLeadsService.execute(ctx.tenantId, dto, ctx.storeId);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Post('leads')
  @ApiOperation({ summary: 'Create a new prospective sales lead' })
  @ApiResponse({ status: 201, description: 'Lead created successfully' })
  async createLead(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateLeadDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.createLeadService.execute(ctx.tenantId, dto, ctx.storeId);
  }

  @Roles(UserRoleEnum.STORE_OWNER)
  @Post('leads/seed')
  @ApiOperation({ summary: 'Seed realistic sales leads for current merchant store' })
  @ApiResponse({ status: 201, description: 'Leads seeded successfully' })
  async seedLeads(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.seedLeadsService.execute(ctx.tenantId, ctx.storeId);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Patch('leads/:id/stage')
  @ApiOperation({ summary: 'Update lead pipeline stage (Kanban drag-and-drop & status change)' })
  @ApiResponse({ status: 200, description: 'Lead stage updated successfully' })
  async updateLeadStage(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLeadStageDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.updateLeadStageService.execute(id, ctx.tenantId, dto.stage, dto.lostReason);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Patch('leads/:id/details')
  @ApiOperation({ summary: 'Update lead requirement notes and estimated deal value' })
  @ApiResponse({ status: 200, description: 'Lead details updated successfully' })
  async updateLeadDetails(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDetailsDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.updateLeadDetailsService.execute(id, ctx.tenantId, dto);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Patch('leads/:id/follow-up')
  @ApiOperation({ summary: 'Schedule or update follow-up reminder date and note' })
  @ApiResponse({ status: 200, description: 'Follow-up updated successfully' })
  async scheduleFollowUp(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: { followUpAt: string | null; note?: string },
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.scheduleLeadFollowUpService.execute(id, ctx.tenantId, body.followUpAt, body.note);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Post('leads/:id/convert')
  @ApiOperation({ summary: 'Convert sales lead into durable Customer 360 profile' })
  @ApiResponse({ status: 200, description: 'Lead converted into customer profile successfully' })
  async convertLead(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body()
    body?: {
      wonAmount?: number;
      createInitialOrder?: boolean;
      paymentMethod?: string;
      items?: any[];
    },
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.convertLeadToCustomerService.execute(
      id,
      ctx.tenantId,
      ctx.storeId,
      body?.wonAmount,
      body?.createInitialOrder,
      body?.paymentMethod,
      body?.items,
    );
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Post('leads/:id/inquiries')
  @ApiOperation({ summary: 'Add a new staff/manager inquiry note to the lead' })
  @ApiResponse({ status: 200, description: 'Inquiry note added successfully' })
  async addLeadInquiry(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: AddLeadInquiryDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.addLeadInquiryService.execute(id, ctx.tenantId, userId, dto);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Delete('leads/:id/inquiries/:inquiryId')
  @ApiOperation({ summary: 'Delete an inquiry note from the lead' })
  @ApiResponse({ status: 200, description: 'Inquiry note deleted successfully' })
  async deleteLeadInquiry(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Param('inquiryId') inquiryId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.deleteLeadInquiryService.execute(id, ctx.tenantId, inquiryId);
  }

  // --- CUSTOMER PROFILE ENDPOINTS (parameterized routes AFTER named routes) ---

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get('fraud-check/by-phone')
  @ApiOperation({ summary: 'Look up FraudBD courier delivery/cancel history by phone number' })
  @ApiResponse({ status: 200, description: 'Fraud check result (cached or freshly fetched)' })
  async fraudCheckByPhone(
    @CurrentUser('sub') userId: string,
    @Query('phone') phone: string,
    @Query('refresh') refresh: string | undefined,
    @Headers('x-store-id') storeId?: string,
  ) {
    if (!phone?.trim()) {
      throw new BadRequestException('A phone number is required.');
    }
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.fraudCheckService.executeForPhone(phone.trim(), ctx.tenantId, refresh === 'true');
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get(':id/fraud-check')
  @ApiOperation({ summary: 'Look up FraudBD courier delivery/cancel history for a customer' })
  @ApiResponse({ status: 200, description: 'Fraud check result (cached or freshly fetched)' })
  async fraudCheckForCustomer(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Query('refresh') refresh: string | undefined,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.fraudCheckService.executeForCustomer(id, ctx.tenantId, refresh === 'true');
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get(':id')
  @ApiOperation({ summary: 'Get customer detail by ID' })
  @ApiResponse({ status: 200, description: 'Customer details' })
  async getCustomerById(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.findCustomerByIdService.execute(id, ctx.tenantId);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Post()
  @ApiOperation({ summary: 'Create a new customer profile' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  async createCustomer(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateCustomerDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.createCustomerService.execute(ctx.tenantId, dto, ctx.storeId);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Patch(':id')
  @ApiOperation({ summary: 'Update editable customer fields' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  async updateCustomer(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.updateCustomerService.execute(id, ctx.tenantId, dto);
  }

  @Roles(UserRoleEnum.STORE_OWNER)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update customer status (ACTIVE / INACTIVE / BLOCKED)' })
  @ApiResponse({ status: 200, description: 'Customer status updated successfully' })
  async updateCustomerStatus(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerStatusDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.updateCustomerStatusService.execute(id, ctx.tenantId, dto);
  }

  // --- ADDRESS ENDPOINTS ---

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get(':id/addresses')
  @ApiOperation({ summary: 'List customer addresses' })
  @ApiResponse({ status: 200, description: 'List of customer addresses' })
  async listAddresses(
    @CurrentUser('sub') userId: string,
    @Param('id') customerId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.listCustomerAddressesService.execute(customerId, ctx.tenantId);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Post(':id/addresses')
  @ApiOperation({ summary: 'Add a new address to customer profile' })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  async createAddress(
    @CurrentUser('sub') userId: string,
    @Param('id') customerId: string,
    @Body() dto: CreateCustomerAddressDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.createCustomerAddressService.execute(customerId, ctx.tenantId, dto, ctx.storeId);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Patch(':id/addresses/:addressId')
  @ApiOperation({ summary: 'Update customer address' })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  async updateAddress(
    @CurrentUser('sub') userId: string,
    @Param('id') customerId: string,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateCustomerAddressDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.updateCustomerAddressService.execute(addressId, customerId, ctx.tenantId, dto);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Patch(':id/addresses/:addressId/default')
  @ApiOperation({ summary: 'Set customer address as default' })
  @ApiResponse({ status: 200, description: 'Address set as default successfully' })
  async setDefaultAddress(
    @CurrentUser('sub') userId: string,
    @Param('id') customerId: string,
    @Param('addressId') addressId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.setDefaultCustomerAddressService.execute(addressId, customerId, ctx.tenantId);
  }

  @Roles(UserRoleEnum.STORE_OWNER)
  @Delete(':id/addresses/:addressId')
  @ApiOperation({ summary: 'Delete customer address' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  async deleteAddress(
    @CurrentUser('sub') userId: string,
    @Param('id') customerId: string,
    @Param('addressId') addressId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.deleteCustomerAddressService.execute(addressId, customerId, ctx.tenantId);
  }

  // --- ORDER HISTORY ENDPOINT ---

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get(':id/orders')
  @ApiOperation({ summary: 'List customer order history' })
  @ApiResponse({ status: 200, description: 'Paginated customer order history' })
  async listCustomerOrders(
    @CurrentUser('sub') userId: string,
    @Param('id') customerId: string,
    @Query() dto: CustomerOrderListDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.listCustomerOrdersService.execute(customerId, ctx.tenantId, dto);
  }

  // --- NOTES ENDPOINTS ---

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get(':id/notes')
  @ApiOperation({ summary: 'List customer internal merchant notes' })
  @ApiResponse({ status: 200, description: 'List of internal notes' })
  async listNotes(
    @CurrentUser('sub') userId: string,
    @Param('id') customerId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.listCustomerNotesService.execute(customerId, ctx.tenantId);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Post(':id/notes')
  @ApiOperation({ summary: 'Create internal merchant note' })
  @ApiResponse({ status: 201, description: 'Note created successfully' })
  async createNote(
    @CurrentUser('sub') userId: string,
    @Param('id') customerId: string,
    @Body() dto: CreateCustomerNoteDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.createCustomerNoteService.execute(customerId, ctx.tenantId, dto, userId, 'Merchant', ctx.storeId);
  }

  @Roles(UserRoleEnum.STORE_OWNER)
  @Delete(':id/notes/:noteId')
  @ApiOperation({ summary: 'Delete internal merchant note' })
  @ApiResponse({ status: 200, description: 'Note deleted successfully' })
  async deleteNote(
    @CurrentUser('sub') userId: string,
    @Param('id') customerId: string,
    @Param('noteId') noteId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.deleteCustomerNoteService.execute(noteId, customerId, ctx.tenantId);
  }

  // --- ACTIVITY TIMELINE ENDPOINT ---

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get(':id/activities')
  @ApiOperation({ summary: 'List customer activity timeline' })
  @ApiResponse({ status: 200, description: 'Chronological activity timeline' })
  async listActivities(
    @CurrentUser('sub') userId: string,
    @Param('id') customerId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.listCustomerActivitiesService.execute(customerId, ctx.tenantId);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Post(':id/activities')
  @ApiOperation({ summary: 'Manually log a staff-initiated interaction (call, WhatsApp, SMS, note, meeting) for a customer' })
  @ApiResponse({ status: 201, description: 'Activity logged successfully' })
  async logActivity(
    @CurrentUser('sub') userId: string,
    @Param('id') customerId: string,
    @Body() dto: LogCustomerActivityDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    const activity = await this.logCustomerActivityService.execute(customerId, ctx.tenantId, dto, 'Merchant', ctx.storeId);
    return { success: true, data: activity };
  }

  @Roles(UserRoleEnum.STORE_OWNER)
  @Post('seed')
  @ApiOperation({ summary: 'Seed 5 realistic Customer 360 profiles for current merchant store' })
  @ApiResponse({ status: 201, description: 'Customers seeded successfully' })
  async seedCustomers(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.seedCustomersService.execute(ctx.tenantId, ctx.storeId);
  }
}
