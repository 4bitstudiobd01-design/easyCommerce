import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '../entities/employee.entity';
import { LeaveRequestEntity, LeaveTypeEnum } from '../entities/leave-request.entity';
import { CreateLeaveRequestDto } from '../dto/leave-request.dto';
import { GetLeaveBalanceService } from './get-leave-balance.service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class CreateLeaveRequestService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(LeaveRequestEntity)
    private readonly leaveRequestRepository: Repository<LeaveRequestEntity>,
    private readonly getLeaveBalanceService: GetLeaveBalanceService,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    createdByUserId: string,
    dto: CreateLeaveRequestDto,
  ): Promise<LeaveRequestEntity> {
    const employee = await this.employeeRepository.findOne({ where: { id: dto.employeeId, storeId } });
    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end < start) {
      throw new BadRequestException('End date cannot be before the start date.');
    }

    const totalDays = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;

    // UNPAID leave has no annual quota to check against — GetLeaveBalanceService
    // only tracks EARNED/CASUAL/SICK, so skip the balance lookup entirely for it.
    if (dto.leaveType !== LeaveTypeEnum.UNPAID) {
      const balance = await this.getLeaveBalanceService.execute(tenantId, storeId, dto.employeeId, start.getFullYear());
      const line = balance.find((b) => b.leaveType === dto.leaveType)!;
      if (totalDays > line.remaining) {
        throw new BadRequestException(
          `This request needs ${totalDays} ${dto.leaveType.toLowerCase()} leave day(s), but only ${line.remaining} remain for ${start.getFullYear()}.`,
        );
      }
    }

    return this.leaveRequestRepository.save(
      this.leaveRequestRepository.create({
        tenantId,
        storeId,
        employeeId: dto.employeeId,
        leaveType: dto.leaveType,
        startDate: dto.startDate,
        endDate: dto.endDate,
        totalDays,
        reason: dto.reason,
        createdByUserId,
      }),
    );
  }
}
