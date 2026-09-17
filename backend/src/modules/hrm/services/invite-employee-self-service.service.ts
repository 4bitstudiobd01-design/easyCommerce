import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '../entities/employee.entity';
import { StaffMemberEntity } from '../../staff/entities/staff.entity';
import { InviteStaffService } from '../../staff/services/invite-staff.service';

@Injectable()
export class InviteEmployeeSelfServiceService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    private readonly inviteStaffService: InviteStaffService,
  ) {}

  /**
   * Reuses the existing staff invitation system rather than a parallel one: this just
   * calls InviteStaffService with the hr:leave:self permission and the employee's own
   * name/email. The employee accepts the invite exactly like any other staff invite
   * (POST /staff/accept-invite); their HR record links up automatically the first time
   * they open a self-service page (see GetMyEmployeeService).
   */
  async execute(tenantId: string, storeId: string, invitedByUserId: string, employeeId: string): Promise<StaffMemberEntity> {
    const employee = await this.employeeRepository.findOne({ where: { id: employeeId, storeId } });
    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }
    if (!employee.email) {
      throw new BadRequestException('This employee has no email on file — add one before inviting them to self-service.');
    }
    if (employee.linkedUserId) {
      throw new BadRequestException('This employee already has a linked self-service login.');
    }

    return this.inviteStaffService.execute(tenantId, storeId, invitedByUserId, {
      name: employee.fullName,
      email: employee.email,
      role: 'Employee (Self-Service)',
      permissions: ['hr:leave:self'],
    });
  }
}
