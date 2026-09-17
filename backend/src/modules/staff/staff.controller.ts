import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';
import { InviteStaffService } from './services/invite-staff.service';
import { ListStaffService } from './services/list-staff.service';
import { UpdateStaffPermissionsService } from './services/update-staff-permissions.service';
import { DeleteStaffService } from './services/delete-staff.service';
import { AcceptStaffInviteService } from './services/accept-staff-invite.service';
import { GetMyPermissionsService } from './services/get-my-permissions.service';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { UpdateStaffPermissionsDto } from './dto/update-staff.dto';
import { AcceptStaffInviteDto } from './dto/accept-invite.dto';

@ApiTags('Merchant Staff Roles & Permissions (RBAC)')
@Controller('staff')
export class StaffController {
  constructor(
    private readonly inviteStaffService: InviteStaffService,
    private readonly listStaffService: ListStaffService,
    private readonly updateStaffPermissionsService: UpdateStaffPermissionsService,
    private readonly deleteStaffService: DeleteStaffService,
    private readonly acceptStaffInviteService: AcceptStaffInviteService,
    private readonly getMyPermissionsService: GetMyPermissionsService,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  private async getStoreContext(userId: string, storeIdHeader?: string) {
    const store = await this.findStoreByUserService.execute(userId, storeIdHeader);
    if (!store) {
      throw new BadRequestException('Merchant store context not found.');
    }
    return store;
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite a new staff member with granular permissions' })
  @ApiResponse({ status: 201, description: 'Staff member invited successfully' })
  async inviteStaff(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: InviteStaffDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.inviteStaffService.execute(store.tenantId, store.id, userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all staff members for active merchant store' })
  @ApiResponse({ status: 200, description: 'List of staff members' })
  async listStaff(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listStaffService.execute(store.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update staff role, permissions, or active status' })
  @ApiResponse({ status: 200, description: 'Staff permissions updated' })
  async updateStaffPermissions(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') staffId: string,
    @Body() dto: UpdateStaffPermissionsDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateStaffPermissionsService.execute(store.id, staffId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke and delete a staff member access' })
  @ApiResponse({ status: 200, description: 'Staff member deleted' })
  async deleteStaff(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') staffId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    await this.deleteStaffService.execute(store.id, staffId);
    return { success: true, message: 'Staff member access revoked successfully.' };
  }

  @Post('accept-invite')
  @ApiOperation({ summary: 'Public endpoint for invited staff to set password and accept invite' })
  @ApiResponse({ status: 200, description: 'Staff invitation accepted' })
  async acceptInvite(@Body() dto: AcceptStaffInviteDto) {
    return this.acceptStaffInviteService.execute(dto);
  }

  @Get('my-permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get logged in user effective staff permissions for store' })
  @ApiResponse({ status: 200, description: 'User effective store permissions' })
  async getMyPermissions(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Headers('x-branch-id') headerBranchId: string,
  ) {
    return this.getMyPermissionsService.execute(userId, headerStoreId, headerBranchId);
  }
}
