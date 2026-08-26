import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftAssignmentEntity } from '../entities/shift-assignment.entity';
import { ShiftEntity } from '../entities/shift.entity';
import { EmployeeEntity } from '../entities/employee.entity';
import { AssignShiftDto } from '../dto/roster.dto';

@Injectable()
export class AssignShiftService {
  constructor(
    @InjectRepository(ShiftAssignmentEntity)
    private readonly shiftAssignmentRepository: Repository<ShiftAssignmentEntity>,
    @InjectRepository(ShiftEntity)
    private readonly shiftRepository: Repository<ShiftEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    assignedByUserId: string,
    dto: AssignShiftDto,
  ): Promise<ShiftAssignmentEntity> {
    const [employee, shift] = await Promise.all([
      this.employeeRepository.findOne({ where: { id: dto.employeeId, storeId } }),
      this.shiftRepository.findOne({ where: { id: dto.shiftId, storeId } }),
    ]);
    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }
    if (!shift) {
      throw new NotFoundException('Shift not found.');
    }
    if (!shift.isActive) {
      throw new BadRequestException('Cannot assign an inactive shift.');
    }

    let assignment = await this.shiftAssignmentRepository.findOne({
      where: { employeeId: dto.employeeId, date: dto.date },
    });

    if (assignment) {
      assignment.shiftId = dto.shiftId;
      assignment.assignedByUserId = assignedByUserId;
    } else {
      assignment = this.shiftAssignmentRepository.create({
        tenantId,
        storeId,
        employeeId: dto.employeeId,
        shiftId: dto.shiftId,
        date: dto.date,
        assignedByUserId,
      });
    }

    return this.shiftAssignmentRepository.save(assignment);
  }
}
